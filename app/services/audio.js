import Ember from 'ember';

export default Ember.Service.extend({
    init() {
        this._super(...arguments);

        this.set('getUserMedia', (navigator.getUserMedia ||
                                   navigator.webkitGetUserMedia ||
                                   navigator.mozGetUserMedia ||
                                   navigator.msGetUserMedia));
        
        this.set('audioContext', new (window.AudioContext || window.webkitAudioContext)());

        // TODO: handle error scenarios if getUserMedia and audioContext
        // aren't available
    },
    startListening() {
        alert("start listening!");
    },
    stopListening() {
        alert("stop listening!");
    }
});
