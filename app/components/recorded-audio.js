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
    contentsUrl: Ember.computed('recording', function() {
        return this.get('recording').get('contentsUrl');
    }),
    actions: {
        play() {
            this.get('playAction')(this.get('contentsUrl'));
        },
        destroy() {
            this.get('recording').destroyRecord();
        }
    }
});
