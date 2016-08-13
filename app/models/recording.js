import DS from 'ember-data';

export default DS.Model.extend({
    dateRecorded: DS.attr(),
    contentsUrl: DS.attr()
});
