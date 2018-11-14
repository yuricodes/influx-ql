'use strict';
const assert = require('assert');
const QL = require('..');

describe('influxdb-ql', () => {

  it('getter/seter', () => {
    const ql = new QL();
    const attrList = [
      'series',
      'start',
      'end',
      'limit',
      'slimit',
      'fill',
      'into',
      'order',
      'offset',
      'rp'
    ];
    attrList.forEach((attr) => {
      const v = 1;
      ql[attr] = v;
      assert.equal(ql[attr], v);
    });
  });

  it('basic query', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.RP = 'default';
    ql.addField('status', 'spdy', 'fetch time');
    ql.addGroup('spdy');
    ql.start = '2018-01-27T05:38:56.145Z';
    ql.end = '-3h';
    ql.limit = 10;
    ql.slimit = 5;
    ql.order = 'desc';
    ql.offset = 10;
    ql.soffset = 5;
    ql.where('code', 400);
    ql.where('"use" <= 30');
    ql.fill = 0;
    assert.equal(ql.toSelect(), 'select "fetch time","spdy","status" from "mydb"."default"."http" where "code" = 400 and "use" <= 30 and time <= now() - 3h and time >= \'2018-01-27T05:38:56.145Z\' group by "spdy" fill(0) order by time desc limit 10 slimit 5 offset 10 soffset 5');
  });

  it('addField', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addField('status', 'spdy', 'fetch time');
    assert.equal(ql.toSelect(), 'select "fetch time","spdy","status" from "mydb".."http"');
  });

  it('addField use alias', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addField({
      'fetch time': 'ft',
    });
    assert.equal(ql.toSelect(), 'select "fetch time" as "ft" from "mydb".."http"');
  });

  it('removeField', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addField('status', 'spdy', 'fetch time');
    ql.removeField('spdy', 'fetch time');
    assert.equal(ql.toSelect(), 'select "status" from "mydb".."http"');
  });

  it('removeField is use alias', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addField({
      'fetch time': 'ft',
    });
    ql.removeField('fetch time');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('emptyFields', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addField('status', 'spdy', 'fetch time');
    ql.emptyFields();
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('where("spdy", "1")', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where('spdy', '1');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "spdy" = \'1\'');
  });

  it('where("spdy", ["1", "2"])', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where('spdy', ['1', '2']);
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where ("spdy" = \'1\' or "spdy" = \'2\')');
  });

  it('where("use", 300, ">=")', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where('use', 300, '>=');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "use" >= 300');
  });

  it('where({spdy: "1", method: "GET"})', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where({
      spdy: '1',
      method: 'GET',
    });
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where ("spdy" = \'1\' and "method" = \'GET\')');
  });

  it('where({spdy: "1", method: "GET"}, "!=")', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where({
      spdy: '1',
      method: 'GET',
    }, '!=');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where ("spdy" != \'1\' and "method" != \'GET\')');
  });

  it('where({spdy: "1", method: "GET"}, "or")', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where({
      spdy: '1',
      method: 'GET',
    }, 'or');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where ("spdy" = \'1\' or "method" = \'GET\')');
  });

  it('where("spdy = \'1\' and method = \'GET\'")', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where("spdy = '1' and method = 'GET'");
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where (spdy = \'1\' and method = \'GET\')');
  });

  it('where({spdy: "/1|2/"})', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where({spdy: '/1|2/'});
    ql.where({method: /GET/});
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "method" = /GET/ and "spdy" = /1|2/');
  });

  it('where({path: "/"}', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where({path: '/'});
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "path" = \'/\'');
  });

  it('where({})', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where({});
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('call where twice', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where('spdy', '1');
    ql.where('method', 'GET');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "method" = \'GET\' and "spdy" = \'1\'');

    ql.relation = 'or';
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "method" = \'GET\' or "spdy" = \'1\'');
  });

  it('emptyConditions', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.where('spdy', '1');
    ql.where('method', 'GET');
    ql.emptyConditions();
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('addMeasurement', () => {
    const ql = new QL('mydb');
    ql.RP = 'test'
    ql.addMeasurement('http');
    ql.addMeasurement('https');
    assert.equal(ql.toSelect(), 'select * from "mydb"."test"."http","mydb"."test"."https"');
  });

  it('addMeasurement no retention policy', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addMeasurement('https');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http","mydb".."https"');
  });

  it('addMeasurement no db', () => {
    const ql = new QL();
    ql.addMeasurement('http');
    ql.addMeasurement('https');
    assert.equal(ql.toSelect(), 'select * from "http","https"');
  });

  it('removeMeasurement', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addMeasurement('https');
    ql.removeMeasurement('http');
    assert.equal(ql.toSelect(), 'select * from "mydb".."https"');
  });

  it('emptyMeasurements', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.emptyMeasurements();
    assert.equal(ql.toSelect(), 'select * from "mydb"');
  });

  it('addFunction', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addGroup('spdy');
    ql.addFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select count("use") from "mydb".."http" group by "spdy"');
  });

  it('addFunction, multi params', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addFunction('bottom', 'use', 3);
    assert.equal(ql.toSelect(), 'select bottom("use",3) from "mydb".."http"');
  });

  it('addFunction, single param', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addFunction('bottom("use",3)');
    assert.equal(ql.toSelect(), 'select bottom("use",3) from "mydb".."http"');
  });

  it('addFunction and addField', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addFunction('bottom("use",3)');
    ql.addField('spdy');
    assert.equal(ql.toSelect(), 'select "spdy",bottom("use",3) from "mydb".."http"');
  });

  it('addFunction and use alias', () => {
    let ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addFunction('bottom("use",3)', {
      alias: 'bot3Use',
    });
    ql.addField('spdy');
    assert.equal(ql.toSelect(), 'select "spdy",bottom("use",3) as "bot3Use" from "mydb".."http"');

    ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addFunction('bottom', 'use', 3, {
      alias: 'bot3Use',
    });
    ql.addField('spdy');
    assert.equal(ql.toSelect(), 'select "spdy",bottom("use",3) as "bot3Use" from "mydb".."http"');
  });

  it('removeFunction', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addGroup('spdy');
    ql.addFunction('count', 'use');
    ql.addFunction('mean', 'use');
    ql.removeFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "mydb".."http" group by "spdy"');
  });

  it('removeFunction use alias', () => {
    let ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addFunction('bottom("use",3)', {
      alias: 'bot3Use',
    });
    ql.addField('spdy');
    ql.removeFunction('bottom("use",3)');
    assert.equal(ql.toSelect(), 'select "spdy" from "mydb".."http"');
  });

  it('emptyFunctions', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addGroup('spdy');
    ql.addFunction('count', 'use');
    ql.addFunction('mean', 'use');
    ql.emptyFunctions();
    ql.addFunction('count', 'url');
    assert.equal(ql.toSelect(), 'select count("url") from "mydb".."http" group by "spdy"');
  });

  it('addGroup', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addGroup('spdy', 'method');
    ql.addFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select count("use") from "mydb".."http" group by "method","spdy"');
  });

  it('removeGroup', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addGroup('spdy', 'method');
    ql.addFunction('count', 'use');
    ql.removeGroup('spdy');
    assert.equal(ql.toSelect(), 'select count("use") from "mydb".."http" group by "method"');
  });

  it('emptyGroups', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addGroup('spdy', 'method');
    ql.emptyGroups();
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('select *', () => {
    const ql = new QL();
    ql.addMeasurement('http');
    assert.equal(ql.toSelect(), 'select * from "http"');
  });
  it('set db', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');

    ql.RP = 'rp';
    assert.equal(ql.RP, 'rp');
    assert.equal(ql.toSelect(), 'select * from "mydb"."rp"."http"');
  });
  it('select field', () => {
    const ql = new QL();
    ql.addMeasurement('http');
    ql.addField('status');
    assert.equal(ql.toSelect(), 'select "status" from "http"');

    ql.removeField('status');
    assert.equal(ql.toSelect(), 'select * from "http"');

    ql.addField('ajax status');
    assert.equal(ql.toSelect(), 'select "ajax status" from "http"');
  });

  it('select multi fields', () => {
    const ql = new QL();
    ql.addMeasurement('http');
    ql.addField('status', 'code');
    assert.equal(ql.toSelect(), 'select "code","status" from "http"');

    ql.removeField('status', 'code');
    assert.equal(ql.toSelect(), 'select * from "http"');
  });

  it('set start and end time', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.start = '2016-03-01 23:32:01.232';
    ql.end = '2016-03-02';
    assert.equal(ql.toSelect(), 'select * from "http" where time <= \'2016-03-02\' and time >= \'2016-03-01 23:32:01.232\'');

    // 3 hours ago
    ql.end = '-3h';
    assert.equal(ql.toSelect(), 'select * from "http" where time <= now() - 3h and time >= \'2016-03-01 23:32:01.232\'');

    // Absolute time
    ql.end = '1388534400s';
    assert.equal(ql.toSelect(), 'select * from "http" where time <= 1388534400s and time >= \'2016-03-01 23:32:01.232\'');
  });

  it('set limit', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.limit = 10;

    assert.equal(ql.toSelect(), 'select * from "http" limit 10');
  });

  it('set slimit', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.addGroup('*');
    ql.slimit = 10;

    assert.equal(ql.toSelect(), 'select * from "http" group by * slimit 10');

    ql.limit = 5;
    assert.equal(ql.toSelect(), 'select * from "http" group by * limit 5 slimit 10');
  });

  it('add conditions', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.where({
      code: 500,
      spdy: '1',
    });
    assert.equal(ql.toSelect(), 'select * from "http" where ("code" = 500 and "spdy" = \'1\')');

    ql.where('code', 404);
    ql.relation = 'or';
    assert.equal(ql.toSelect(), 'select * from "http" where "code" = 404 or ("code" = 500 and "spdy" = \'1\')');

    ql.emptyConditions();
    ql.where('spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from "http" where "spdy" = \'slow\'');

    ql.emptyConditions();
    ql.where('http spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from "http" where "http spdy" = \'slow\'');
  });
  it('add or where', () => {
    const ql = new QL();
    ql.addMeasurement('http');
    ql.where('spdy', ['slow', 'fast']);
    assert.equal(ql.toSelect(), 'select * from "http" where ("spdy" = \'slow\' or "spdy" = \'fast\')');
  });


  it('function', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.addFunction('mean', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http"');

    ql.addFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select count("use"),mean("use") from "http"');

    ql.removeFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http"');

    ql.emptyFunctions();
    assert.equal(ql.toSelect(), 'select * from "http"');
  });


  it('group', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.addGroup('spdy');
    ql.addFunction('mean', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy"');

    ql.addGroup('status', 'time(6h)');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy","status",time(6h)');

    ql.removeGroup('status', 'time(6h)', 'spdy');
    ql.addGroup('ajax status');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "ajax status"');

    ql.addGroup('time(6h, 10m)', 'spdy')
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "ajax status","spdy",time(6h, 10m)');
  });

  it('fill', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.addFunction('mean', 'use');
    ql.addGroup('spdy');
    ql.fill = 100;
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy" fill(100)');
  });

  it('into', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.into = 'http copy';
    assert.equal(ql.toSelect(), 'select * into "http copy" from "http"');

    ql.addFunction('mean', 'use');
    ql.where('spdy', 'slow');
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(10m)');

    assert.equal(ql.toSelect(), 'select mean("use") into "http copy" from "http" where "spdy" = \'slow\' and time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(10m)');

  });


  it('from custom rp into', () => {
    const ql = new QL();
    ql.addMeasurement('http');
    ql.database = 'mydb';
    ql.rp = 'my-rp';

    assert.equal(ql.database, 'mydb');

    ql.into = 'http copy';
    assert.equal(ql.toSelect(), 'select * into "http copy" from "mydb".."http"');

    ql.intoDatabase = 'mydb';
    ql.intoRP = 'my-rp';
    assert.equal(ql.intoRP, 'my-rp');
    assert.equal(ql.toSelect(), 'select * into "mydb"."my-rp"."http copy" from "mydb".."http"');
  });

  it('order', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.order = 'desc';
    assert.equal(ql.toSelect(), 'select * from "http" order by time desc');
  });

  it('offset', () => {
    const ql = new QL();
    ql.addMeasurement('http');

    ql.offset = 10;
    assert.equal(ql.toSelect(), 'select * from "http" offset 10');
  });

  it('clean', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addField('fetch time');
    ql.addGroup('spdy');
    assert.equal(ql.toSelect(), 'select "fetch time" from "mydb".."http" group by "spdy"');
    ql.clean();
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('subQuery', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addFunction('max', 'fetch time');
    ql.addGroup('spdy');
    ql.subQuery();
    ql.addFunction('sum', 'max');
    assert.equal(ql.toSelect(), 'select sum("max") from (select max("fetch time") from "mydb".."http" group by "spdy")');
  });


  it('multiQuery', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addFunction('max', 'fetch time');
    ql.addGroup('spdy');
    ql.multiQuery();
    ql.addFunction('sum', 'max');
    assert.equal(ql.toSelect(), 'select max("fetch time") from "mydb".."http" group by "spdy";select sum("max") from "mydb".."http"');
  });

  it('CQ', () => {
    const ql = new QL();
    ql.addMeasurement('http');
    ql.database = 'mydb';
    ql.intoDatabase = 'mydb';
    ql.into = 'http copy';

    ql.cqName = 'combine-http';
    ql.cqEvery = '2m';
    ql.cqFor = '1m';

    ql.addFunction('count', 'use');
    ql.addGroup('time(5m)');

    assert.equal(ql.toCQ(), 'create continuous query "combine-http" on "mydb" resample every 2m for 1m begin select count("use") into "mydb".."http copy" from "mydb".."http" group by time(5m) end');
  });

  it('createDatabase', () => {
    assert.equal(QL.createDatabase('mydb'), 'create database mydb');
  });

  it('createDatabaseNotExists', () => {
    assert.equal(QL.createDatabaseNotExists('mydb'), 'create database if not exists mydb');
    assert.equal(QL.createDatabaseNotExists('my db'), 'create database if not exists "my db"');
  });

  it('dropDatabase', () => {
    assert.equal(QL.dropDatabase('mydb'), 'drop database mydb');
    assert.equal(QL.dropDatabase('my db'), 'drop database "my db"');
  });

  it('showDatabases', () => {
    assert.equal(QL.showDatabases(), 'show databases');
  });

  it('showRetentionPolicies', () => {
    assert.equal(QL.showRetentionPolicies('mydb'), 'show retention policies on mydb');
    assert.equal(QL.showRetentionPolicies('my db'), 'show retention policies on "my db"');
  });

  it('showMeasurements', () => {
    assert.equal(QL.showMeasurements(), 'show measurements');
  });

  it('showTagKeys', () => {
    assert.equal(QL.showTagKeys(), 'show tag keys');
    assert.equal(QL.showTagKeys('http'), 'show tag keys from "http"');
    assert.equal(QL.showTagKeys('http measurement'), 'show tag keys from "http measurement"');
  });

  it('showFieldKeys', () => {
    assert.equal(QL.showFieldKeys(), 'show field keys');
    assert.equal(QL.showFieldKeys('http'), 'show field keys from "http"');
    assert.equal(QL.showFieldKeys('http measurement'), 'show field keys from "http measurement"');
  });

  it('showSeries', () => {
    assert.equal(QL.showSeries(), 'show series');
    assert.equal(QL.showSeries('http'), 'show series from "http"');
    assert.equal(QL.showSeries('http measurement'), 'show series from "http measurement"');
  });

  it('createRP', () => {
    assert.equal(QL.createRP('two_hours', 'mydb', '2h'), 'create retention policy "two_hours" on "mydb" duration 2h replication 1');

    assert.equal(QL.createRP('two_hours', 'mydb', '2h', 1, true), 'create retention policy "two_hours" on "mydb" duration 2h replication 1 default');
    assert.equal(QL.createRP('two_hours', 'mydb', '2h', true, 2), 'create retention policy "two_hours" on "mydb" duration 2h replication 2 default');

    assert.equal(QL.createRP('two_hours', 'mydb', '2d', '1h', true, 2), 'create retention policy "two_hours" on "mydb" duration 2d replication 2 shard duration 1h default');
  });

  it('dropRP', () => {
    assert.equal(QL.dropRP('two_hours', 'mydb'), 'drop retention policy "two_hours" on "mydb"');
  });

  it('updateRP', () => {
    assert.equal(QL.updateRP('two_hours', 'mydb', '0', 1, '5m', false), 'alter retention policy "two_hours" on "mydb" replication 1 shard duration 5m');

    assert.equal(QL.updateRP('two_hours', 'mydb', '2w', 1, '5m', true), 'alter retention policy "two_hours" on "mydb" duration 2w replication 1 shard duration 5m default');
  });
});
return;
describe('influxdb/data_exploration', () => {

  it('The basic SELECT statement', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';
    ql.addField('level description', 'location', 'water_level');
    assert.equal(ql.toSelect(), 'select "level description","location","water_level" from "h2o_feet"');
  });

  it('The SELECT statement and arithmetic', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // Perform basic arithmetic operations on fields that store floats and integers.
    ql.addField('"water_level" + 2');
    assert.equal(ql.toSelect(), 'select "water_level" + 2 from "h2o_feet"');

    ql.removeField('"water_level" + 2');
    ql.addField('("water_level" * 2) + 4');
    assert.equal(ql.toSelect(), 'select ("water_level" * 2) + 4 from "h2o_feet"');
  });

  it('The WHERE clause', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // Return data where the tag key location has the tag value santa_monica:
    ql.addField('water_level');
    ql.where('location', 'santa_monica');
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" where "location" = \'santa_monica\'');

    // Return data where the tag key location has no tag value (more on regular expressions later):
    ql.removeAllCondition();
    ql.removeField('water_level');
    ql.where('location', '/./', '!~');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "location" !~ /./');
    
    ql.removeAllCondition();
    ql.removeField('water_level');
    ql.where('location', /./, '!~');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "location" !~ /./');

    // Return data where the tag key location has no tag value (more on regular expressions later):
    ql.removeAllCondition();
    ql.where('location', '/./', '=~');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "location" =~ /./');

    // Return data from the past seven days:
    ql.removeAllCondition();
    ql.start = '-7d';
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where time >= now() - 7d');

    // Return data where the tag key location has the tag value coyote_creek and the field water_level is greater than 8 feet:
    ql.start = null;
    ql.where('location', 'coyote_creek');
    ql.where('water_level', 8, '>');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "location" = \'coyote_creek\' and "water_level" > 8');

    // Return data where the tag key location has the tag value santa_monica and the field level description equals 'below 3 feet':
    ql.removeAllCondition();
    ql.where('location', 'santa_monica');
    ql.where('level description', 'below 3 feet');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "level description" = \'below 3 feet\' and "location" = \'santa_monica\'');

    // Return data where the field values in water_level plus 2 are greater than 11.9
    ql.removeAllCondition();
    ql.where('"water_level" + 2', 11.9, '>');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "water_level" + 2 > 11.9');
  });

  it('The GROUP BY clause', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // Calculate the MEAN() water_level for the different tag values of location:
    ql.addCalculate('mean', 'water_level');
    ql.addGroup('location');
    assert.equal(ql.toSelect(), 'select mean("water_level") from "h2o_feet" group by "location"');

    // Calculate the MEAN() index for every tag set in h2o_quality:
    ql.removeAllCalculate();
    ql.removeAllGroup();
    ql.addCalculate('mean', 'index');
    ql.addGroup('*');
    assert.equal(ql.toSelect(), 'select mean("index") from "h2o_feet" group by *');

    // COUNT() the number of water_level points between August 19, 2015 at midnight and August 27 at 5:00pm at three day intervals:
    ql.removeAllCalculate();
    ql.removeAllGroup();
    ql.addCalculate('count', 'water_level');
    ql.start = '2015-08-19T00:00:00Z';
    ql.end = '2015-08-27T17:00:00Z';
    ql.where('location', 'coyote_creek');
    ql.addGroup('time(3d)');
    assert.equal(ql.toSelect(), 'select count("water_level") from "h2o_feet" where "location" = \'coyote_creek\' and time <= \'2015-08-27T17:00:00Z\' and time >= \'2015-08-19T00:00:00Z\' group by time(3d)');

    // GROUP BY time() also allows you to alter the default rounded calendar time boundaries by including an offset interval.
    ql.removeAllGroup();
    ql.addGroup('time(3d,1d)');
    assert.equal(ql.toSelect(), 'select count("water_level") from "h2o_feet" where "location" = \'coyote_creek\' and time <= \'2015-08-27T17:00:00Z\' and time >= \'2015-08-19T00:00:00Z\' group by time(3d,1d)');

    // COUNT() the number of water_level points between August 19, 2015 at midnight and August 27 at 5:00pm at three day intervals, and offset the time boundary by -2 days:
    ql.removeAllGroup();
    ql.addGroup('time(3d,-2d)');
    assert.equal(ql.toSelect(), 'select count("water_level") from "h2o_feet" where "location" = \'coyote_creek\' and time <= \'2015-08-27T17:00:00Z\' and time >= \'2015-08-19T00:00:00Z\' group by time(3d,-2d)');
  });

  it('GROUP BY tag values AND a time interval', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // Separate multiple GROUP BY arguments with a comma.
    ql.start = '-2w';
    ql.addCalculate('mean', 'water_level');
    ql.addGroup('location', 'time(6h)');
    assert.equal(ql.toSelect(), 'select mean("water_level") from "h2o_feet" where time >= now() - 2w group by "location",time(6h)');
  });

  it('The GROUP BY clause and fill()', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // GROUP BY with fill()
    ql.addCalculate('mean', 'water_level');
    ql.start = '2015-08-18';
    ql.end = '2015-09-24';
    ql.addGroup('time(10d)');
    ql.fill = -100;
    assert.equal(ql.toSelect(), 'select mean("water_level") from "h2o_feet" where time <= \'2015-09-24\' and time >= \'2015-08-18\' group by time(10d) fill(-100)');

    ql.fill = 'none';
    assert.equal(ql.toSelect(), 'select mean("water_level") from "h2o_feet" where time <= \'2015-09-24\' and time >= \'2015-08-18\' group by time(10d) fill(none)');
  });

  it('The INTO clause', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    ql.into = 'h2o_feet_copy';
    ql.addField('water_level');
    ql.where('location', 'coyote_creek');
    assert.equal(ql.toSelect(), 'select "water_level" into "h2o_feet_copy" from "h2o_feet" where "location" = \'coyote_creek\'');


    // Calculate the average water_level in santa_monica, and write the results to a new measurement (average) in the same database:
    ql.removeAllField();
    ql.removeAllCondition();
    ql.into = 'average';
    ql.addCalculate('mean', 'water_level');
    ql.where('location', 'santa_monica');
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(12m)');
    assert.equal(ql.toSelect(), 'select mean("water_level") into "average" from "h2o_feet" where "location" = \'santa_monica\' and time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(12m)');

    // Calculate the average water_level and the max water_level in santa_monica, and write the results to a new measurement (aggregates) in a different database (where_else):
    ql.removeAllField();
    ql.removeAllCondition();
    ql.removeAllCalculate();
    ql.into = 'aggregates'
    ql.intoDatabase = 'where_else';
    ql.intoRP = 'autogen';
    ql.addCalculate('mean', 'water_level');
    ql.addCalculate('max', 'water_level');
    ql.where('location', 'santa_monica');
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(12m)');
    assert.equal(ql.toSelect(), 'select max("water_level"),mean("water_level") into "where_else"."autogen"."aggregates" from "h2o_feet" where "location" = \'santa_monica\' and time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(12m),time(12m)');

    ql.removeAllField();
    ql.removeAllCondition();
    ql.removeAllCalculate();
    ql.addCalculate('mean', 'degrees');
    ql.into = ':MEASUREMENT';
    ql.intoDatabase = 'where_else';
    ql.intoRP = 'autogen';
    ql.measurement = '/temperature/';
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(12m)');
    assert.equal(ql.toSelect(), 'select mean("degrees") into "where_else"."autogen".:MEASUREMENT from /temperature/ where time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(12m),time(12m),time(12m)');
  });

  it('Limit the number of results returned per series with LIMIT', () => {
    const ql = new QL();

    // Return the three oldest points from each series associated with the measurement h2o_feet:
    ql.measurement = 'h2o_feet';
    ql.addGroup('*');
    ql.limit = 3;
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" group by * limit 3');
  });

  it('Limit the number of series returned with SLIMIT', () => {
    const ql = new QL();

    // Return everything from one of the series associated with the measurement h2o_feet:
    ql.measurement = 'h2o_feet';
    ql.addField('water_level');
    ql.addGroup('*');
    ql.slimit = 1;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" group by * slimit 1');
  });

  it('Limit the number of points and series returned with LIMIT and SLIMIT', () => {
    const ql = new QL();

    // Return the three oldest points from one of the series associated with the measurement h2o_feet:
    ql.addField('water_level');
    ql.measurement = 'h2o_feet';
    ql.addGroup('*');
    ql.limit = 3;
    ql.slimit = 1;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" group by * limit 3 slimit 1');
  });

  it('Sort query returns with ORDER BY time DESC', () => {
    const ql = new QL();

    // Now include ORDER BY time DESC to get the newest five points from the same series:
    ql.addField('water_level');
    ql.measurement = 'h2o_feet';
    ql.where('location', 'santa_monica');
    ql.order = 'desc';
    ql.limit = 5;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" where "location" = \'santa_monica\' order by time desc limit 5');
  });

  it('Paginate query returns with OFFSET and SOFFSET', () => {
    const ql = new QL();

    // Then get the second three points from that same series:
    ql.addField('water_level');
    ql.measurement = 'h2o_feet';
    ql.where('location', 'coyote_creek');
    ql.limit = 3;
    ql.offset = 3;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" where "location" = \'coyote_creek\' limit 3 offset 3');

    ql.offset = 0;
    ql.slimit = 1;
    ql.soffset = 1;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" where "location" = \'coyote_creek\' limit 3 slimit 1 soffset 1');
  });

  it('double quote identifiers', () => {
    // Double quote identifiers if they start with a digit, contain characters other than [A-z,0-9,_], or if they are an InfluxQL keyword
    function convert(field) {
      const f = field.toLowerCase();
      const digitReg = /^[0-9]/;
      const reg = /[^a-z0-9_]/;
      /* istanbul ignore else */
      if (digitReg.test(f) || reg.test(f)) {
        return `"${field}"`;
      }
      return field;
    }

    assert.equal(convert('012'), '"012"');
    assert.equal(convert('ABab'), 'ABab');
    assert.equal(convert('A-B'), '"A-B"');
    assert.equal(convert('A B'), '"A B"');
  });

});
