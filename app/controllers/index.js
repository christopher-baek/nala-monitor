import Ember from 'ember';

export default Ember.Controller.extend({
    audioService: Ember.inject.service('audio'),
    started: Ember.computed('audioService.started', function() {
        return this.get('audioService').get('started');
    }),
    listening: Ember.computed('audioService.listening', function() {
        return this.get('audioService').get('listening');
    }),
    active: Ember.computed('audioService.active', function() {
        return this.get('audioService').get('active');
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
            return this.get('audioService').get('silenceTimeout')/1000;
        },
        set(key, value) {
            this.get('audioService').set('silenceTimeout', value * 1000);
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
            }
        },
        stopListening() {
            if (this.get('listening')) {
                let audioService = this.get('audioService');
                let store = this.get('store');

                let date = new Date();

                audioService.stopListening().then((wavBlob) => {
                    let contentsUrl = (window.URL || window.webkitURL).createObjectURL(wavBlob);

                    let recording = store.createRecord('recording', {
                        dateRecorded: date,
                        contentsUrl: contentsUrl
                    });
                    recording.save();
                }).catch((error) => {
                    // TODO: improve this
                    alert('Received the following error while stopping audio service: '+ error);
                });
            }
        }
    }
});
