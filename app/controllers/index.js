import Ember from 'ember';

export default Ember.Controller.extend({
    status: "loading",
    init() {
        this._super(...arguments);
        this.set('status', 'loaded');
    }
});
