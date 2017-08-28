import { get } from '@ember/object';
import { run } from '@ember/runloop';
import { createStore } from 'dummy/tests/helpers/store';

import { module, test } from 'qunit';

import DS from 'ember-data';

let Person, store, array, moreArray;

module("integration/peek-all - DS.Store#peekAll()", {
  beforeEach() {
    array = {
      data: [{
        type: 'person',
        id: '1',
        attributes: {
          name: "Scumbag Dale"
        }
      }, {
        type: 'person',
        id: '2',
        attributes: {
          name: "Scumbag Katz"
        }
      }]
    };
    moreArray = {
      data: [{
        type: 'person',
        id: '3',
        attributes: {
          name: "Scumbag Bryn"
        }
      }]
    };

    Person = DS.Model.extend({ name: DS.attr('string') });

    store = createStore({ person: Person });
  },
  afterEach() {
    run(store, 'destroy');
    Person = null;
    array = null;
  }
});

test("store.peekAll('person') should return all records and should update with new ones", function(assert) {
  run(() => {
    store.push(array);
  });

  let all = store.peekAll('person');
  assert.equal(get(all, 'length'), 2);

  run(() => {
    store.push(moreArray);
  });

  assert.equal(get(all, 'length'), 3);
});

test("Calling store.peekAll() multiple times should update immediately inside the runloop", function(assert) {
  assert.expect(3);

  run(() => {
    assert.equal(get(store.peekAll('person'), 'length'), 0, 'should initially be empty');
    store.createRecord('person', { name: "Tomster" });
    assert.equal(get(store.peekAll('person'), 'length'), 1, 'should contain one person');
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: "Tomster's friend"
        }
      }
    });
    assert.equal(get(store.peekAll('person'), 'length'), 2, 'should contain two people');
  });
});

test("Calling store.peekAll() after creating a record should return correct data", function(assert) {
  assert.expect(1);

  run(() => {
    store.createRecord('person', { name: "Tomster" });
    assert.equal(get(store.peekAll('person'), 'length'), 1, 'should contain one person');
  });
});

test("Unloading record that is in a peekAll array", function(assert) {
  let allPeople = store.peekAll('person');

  run(() => {
    store.createRecord('person', { name: "Tomster" });
    store.createRecord('person', { name: "Zoey" });
  });

  assert.equal(get(store.peekAll('person'), 'length'), 2, 'should contain two persons');

  run(() => {
    allPeople.objectAt(0).unloadRecord();

    assert.equal(get(allPeople, 'length'), 2, 'Unload does not complete until the end of the loop');
    assert.ok(get(allPeople.objectAt(0), 'name'), 'Tomster', 'Tomster is still the first object until the end of the loop');
    assert.ok(get(allPeople.objectAt(1), 'name'), 'Zoey', 'Zoey is still the sencond object until the end of the loop');
  });

  assert.equal(get(allPeople, 'length'), 1, 'Unloaded record removed from the array');
  assert.ok(get(allPeople.objectAt(0), 'name'), 'Zoey', 'Zoey is now the first object');
});
