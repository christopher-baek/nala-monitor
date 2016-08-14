import Ember from 'ember';

export default Ember.Controller.extend({
    audioService: Ember.inject.service('audio'),
    // TODO: remove this since the service holds the more relevant status
    status: 'loading',
    started: Ember.computed('audioService.started', function() {
        return `${this.get('audioService').get('started')}`;
    }),
    listening: Ember.computed('audioService.listening', function() {
        return `${this.get('audioService').get('listening')}`;
    }),
    active: Ember.computed('audioService.active', function() {
        return `${this.get('audioService').get('active')}`;
    }),
    volume: Ember.computed('audioService.volume', function() {
        return `${this.get('audioService').get('volume')}`;
    }),
    init() {
        this._super(...arguments);
        this.set('status', 'stopped');
    },
    actions: {
        startListening() {
            this.get('audioService').startListening();
            this.set('status', 'listening');
        },
        stopListening() {
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

            this.set('status', 'stopped');
        }
    }
});
