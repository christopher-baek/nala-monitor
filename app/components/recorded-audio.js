import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'tr',
    recording: '',
    name: Ember.computed('recording', function() {
        return `${this.get('recording').get('dateRecorded')}`;
    }),
    filename: Ember.computed('name', function() {
        return `${this.get('name')}.wav`;
    }),
    url: Ember.computed('recording', function() {
        return this.get('recording').get('contentsUrl');
    }),
    actions: {
        delete() {
            this.get('recording').destroyRecord();
        }
    }
});
