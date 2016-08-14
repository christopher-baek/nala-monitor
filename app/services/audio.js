import Ember from 'ember';


const BUFFER_LENGTH = 4096;
const CHANNEL_COUNT = 2;


export default Ember.Service.extend({
    started: false,
    listening: false,
    active: false,
    volume: 0,
    // TODO: make the threshold controllable by user input
    threshold: 10,
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
        if (this.get('listening')) {
            // if already listening, must already be started also
            // nothing to do
            return;
        }

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
                    analyser.smoothingTimeConstant = 0.3;
                    analyser.fftSize = 1024;

                    // set up a procsesor to process audio
                    let scriptProcessor = audioContext.createScriptProcessor(BUFFER_LENGTH, CHANNEL_COUNT, CHANNEL_COUNT);
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        let inputBufferLeft = audioProcessingEvent.inputBuffer.getChannelData(0);
                        let inputBufferRight = audioProcessingEvent.inputBuffer.getChannelData(1);

                        // send for recording
                        audioWorker.postMessage({
                            command: 'record',
                            inputBuffers: [inputBufferLeft, inputBufferRight]
                        });

                        // check volume
                        let frequencyDataLeft = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(frequencyDataLeft);

                        let averageVolume = self._calculateAverageVolume(frequencyDataLeft);
                        self.set('volume', averageVolume);

                        if (self.get('active') && averageVolume < self.get('threshold')) {
                            self.set('active', false);
                        } else if (!self.get('active') && averageVolume > self.get('threshold')) {
                            self.set('active', true);
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
    stopListening() {
        // pause the audo context
        this.get('audioContext').suspend();

        // update the status
        this.set('listening', false);
        
        let audioWorker = this.get('audioWorker');

        let promise = new Ember.RSVP.Promise(function(resolve, reject) {
            audioWorker.onmessage = function(messageEvent) {
                audioWorker.postMessage({command: 'reset'});
                resolve(messageEvent.data.wavBlob);
            };

            // TODO: call the reject handler
        });

        audioWorker.postMessage({command: 'exportWav'});

        return promise;
    }
});
