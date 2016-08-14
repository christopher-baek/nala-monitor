import Ember from 'ember';


const BUFFER_LENGTH = 4096;
const CHANNEL_COUNT = 2;
const CHANNEL_INDEX_LEFT = 0;
const CHANNEL_INDEX_RIGHT = 1;

const ANALYZER_SMOOTHING_TIME_CONSTANT = 0.3;
const ANALYZER_FFT_SIZE = 1024;


export default Ember.Service.extend({
    store: Ember.inject.service('store'),
    started: false,
    listening: false,
    recording: false,
    recordingStart: undefined,
    volume: 0,
    activateThreshold: 30,
    silenceTimeout: 5000,
    init() {
        let self = this;

        self._super(...arguments);

        // request access to the microphone
        navigator.getUserMedia = (navigator.getUserMedia ||
                                  navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia ||
                                  navigator.msGetUserMedia);

        // initialize audio context in which 
        // audio handling will take place
        let audioContext = self._createAudioContext();
        self.set('audioContext', audioContext);

        // TODO: handle error scenarios if getUserMedia and audioContext
        // aren't available

        // initialize audio worker
        let audioWorker = new Worker('assets/workers/audio.js');
        audioWorker.postMessage({
            command: 'initialize',
            configuration: {
                sampleRate: audioContext.sampleRate
            }
        });
        self.set('audioWorker', audioWorker);
    },
    _createAudioContext() {
        let AudioContext = (window.AudioContext || window.webkitAudioContext);
        return new AudioContext();
    },
    startListening() {
        if (this.get('started')) {
            // if this has aleady been started but is not listening,
            // the audio context must be resumed
            this.get('audioContext').resume();
        } else {
            let audioContext = this.get('audioContext');
            let audioWorker = this.get('audioWorker');
            let self = this;

            navigator.getUserMedia({audio: true},
                (stream) => {
                    // get the input source
                    let source = audioContext.createMediaStreamSource(stream);

                    // set up an analyser
                    let analyser = audioContext.createAnalyser();
                    analyser.smoothingTimeConstant = ANALYZER_SMOOTHING_TIME_CONSTANT;
                    analyser.fftSize = ANALYZER_FFT_SIZE;

                    // set up a procsesor to process audio
                    let scriptProcessor = audioContext.createScriptProcessor(BUFFER_LENGTH, CHANNEL_COUNT, CHANNEL_COUNT);
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        let inputBufferLeft = audioProcessingEvent.inputBuffer.getChannelData(CHANNEL_INDEX_LEFT);
                        let inputBufferRight = audioProcessingEvent.inputBuffer.getChannelData(CHANNEL_INDEX_RIGHT);

                        // check volume
                        let frequencyDataLeft = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(frequencyDataLeft);

                        let averageVolume = self._calculateAverageVolume(frequencyDataLeft);
                        self.set('volume', averageVolume);

                        // if not already recording, check if it should be now
                        if (!self.get('recording') && averageVolume >= self.get('activateThreshold')) {
                            self.set('recording', true);
                            self.set('recordingStart', new Date());
                        }

                        // if recording, there is work to do
                        if (self.get('recording')) {
                            // send for recording
                            audioWorker.postMessage({
                                command: 'record',
                                inputBuffers: [inputBufferLeft, inputBufferRight]
                            });

                            // check if the recording should be stopped
                            if (averageVolume < self.get('activateThreshold')) {
                                let recordingStart = self.get('recordingStart');
                                let now = new Date().getTime();

                                if (now - recordingStart.getTime() > self.get('silenceTimeout')) {
                                    self.set('recording', false);

                                    self._saveRecording();
                                }
                            }
                        }
                    };

                    // connect the nodes
                    source.connect(analyser);
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(audioContext.destination);
                },
                (error) => {
                    alert('Receievd the following error while retrieving user media: ' + error);
                    // TODO: notify the context object of failure    
                });

            // update the status
            this.set('started', true);
        }

        // update the status
        this.set('listening', true);
    },
    _calculateAverageVolume(frequencyData) {
        let sum = 0;
        let count = frequencyData.length;

        for (let i = 0; i < count; i++) {
            sum += frequencyData[i];
        }

        let average = sum/count;
        return average;
    },
    _saveRecording() {
        let audioContext = this.get('audioContext');
        let audioWorker = this.get('audioWorker');
        let recordingStart = this.get('recordingStart');
        let self = this;

        // export the data
        new Ember.RSVP.Promise(function(resolve, reject) {
            audioWorker.onmessage = function(messageEvent) {
                audioWorker.postMessage({command: 'reset'});
                resolve(messageEvent.data.wavBlob);
            };

            // TODO: call the reject handler
        }).then((wavBlob) => {
            // save the recording
            let store = self.get('store');

            let contentsUrl = (window.URL || window.webkitURL).createObjectURL(wavBlob);

            let recording = store.createRecord('recording', {
                dateRecorded: recordingStart,
                contentsUrl: contentsUrl
            });
            recording.save();
        }).catch((error) => {
            // TODO: improve this
            alert('Received the following error while stopping audio service: '+ error);
        });

        audioWorker.postMessage({command: 'exportWav'});
    },
    stopListening() {
        // pause the audo context
        this.get('audioContext').suspend();

        // update the status
        this.set('listening', false);
        this.set('recording', false);

        // export the last recording
        this._saveRecording();
    }
});
