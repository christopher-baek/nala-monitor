import Ember from 'ember';

export default Ember.Controller.extend({
    audioService: Ember.inject.service('audio'),
    status: 'loading',
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
            this.get('audioService').stopListening();
            this.set('status', 'stopped');
        }
    }
});
