import Ember from 'ember';

export default Ember.Controller.extend({
    status: 'loading',
    init() {
        this._super(...arguments);
        this.set('status', 'stopped');
    },
    actions: {
        startListening() {
            this.set('status', 'listening');
        },
        stopListening() {
            this.set('status', 'stopped');
        }
    }
});
