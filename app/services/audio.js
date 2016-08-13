import Ember from 'ember';

export default Ember.Service.extend({
    started: false,
    init() {
        this._super(...arguments);
        navigator.getUserMedia = (navigator.getUserMedia ||
                                  navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia ||
                                  navigator.msGetUserMedia);

        this.set('audioContext', this._createAudioContext());

        // TODO: handle error scenarios if getUserMedia and audioContext
        // aren't available
    },
    _createAudioContext() {
        let AudioContext = (window.AudioContext || window.webkitAudioContext);
        return new AudioContext();
    },
    startListening() {
        if (this.get('started')) {
            this.get('audoiContext').resume();
        } else {
            navigator.getUserMedia({audio: true}, this._handleStream, this._handleError);
            this.set('started', true);
        }
    },
    _handleStream(stream) {
        let source = this.audioContext.createMediaStreamSource(stream);
    },
    _handleError(error) {
        alert("Received the follownig error: " + error);
        // TODO: notify the context object of failure
    },
    stopListening() {
        this.get('audioContext').pause();
    }
});
