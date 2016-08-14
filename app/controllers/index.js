import Ember from 'ember';


const MILLISECONDS_PER_SECOND = 1000;


export default Ember.Controller.extend({
    audioService: Ember.inject.service('audio'),
    started: Ember.computed('audioService.started', function() {
        return this.get('audioService').get('started');
    }),
    listening: Ember.computed('audioService.listening', function() {
        return this.get('audioService').get('listening');
    }),
    recording: Ember.computed('audioService.recording', function() {
        return this.get('audioService').get('recording');
    }),
    playing: Ember.computed('audioService.playing', function() {
        return this.get('audioService').get('playing');
    }),
    volume: Ember.computed('audioService.volume', function() {
        return this.get('audioService').get('volume');
    }),
    activateThreshold: Ember.computed('audioService.activateThreshold', {
        get(key) {
            return this.get('audioService').get('activateThreshold');
        },
        set(key, value) {
            this.get('audioService').set('activateThreshold', value);
            return value;
        }
    }),
    silenceTimeout: Ember.computed('audioService.silenceTimeout', {
        get(key) {
            return this.get('audioService').get('silenceTimeout')/MILLISECONDS_PER_SECOND;
        },
        set(key, value) {
            this.get('audioService').set('silenceTimeout', value * MILLISECONDS_PER_SECOND);
            return value;
        }
    }),
    init() {
        this._super(...arguments);
    },
    actions: {
        startListening() {
            if (!this.get('listening')) {
                this.get('audioService').startListening();
            } else {
                alert("I'm already listening!");
            }
        },
        stopListening() {
            if (this.get('listening')) {
                this.get('audioService').stopListening();
            } else {
                alert("I'm already stopped!");
            }
        },
        playRecording(contentsUrl) {
            if (this.get('started') && !this.get('listening') && !this.get('playing')) {
                this.get('audioService').playRecording(contentsUrl);
            } else {
                alert("Can't play unless started nor whlie listening or playing!");
            }
        }
    }
});
