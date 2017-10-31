# node-pg-procedures
Declare procedures once and have them created for you in both Postgres and Javascript


### Example Usage
I am using CSON (cursive script) for more convenient multi-line strings, but you could just use JSON if you prefer.

```
const CSON = require('cursive')
const schema = CSON.parse(fs.readFileSync('./db-schema.cson')) //See below
const pg = require('pg')
const pgproc = require('node-pg-procedures')
const db = new pg.Pool(cfg.db)
const db.ready = pgproc(schema,winston).auto(db).catch(e=>{console.error(e);process.exit(1)})
// ^ Auto adds methods to db
// , starts running the associated SQL to create these procedures
// , and returns a promise
db.ready
.then(()=>db.getPeopleByLastName({last_name:"Smith"})
.then(results => console.log(results) )
```

Alternate usage:
```
//Or, use the SQL and methods manually:
const db = new pg.Pool(cfg.db)
const pgproc = pgproc(schema,winston)
console.log(pgproc)
//{
//  methods: {name:function(...){...}, ... },
//  sql: ["...",...]
//}
//Note that the methods will call this.query, so they should somehow
//get bound to or inherit from your database object
```

Example db-schema.cson
```
[
{sql:
		|CREATE TABLE IF NOT EXISTS people(
		|	id SERIAL PRIMARY KEY,
		|	first_name TEXT,
		|	last_name TEXT
		|)
	}
{procedure: "getPeopleByLastName"
		parameters: [
				{name:"last_name", type:"varchar(100)"}
			]
		sql:
			|RETURNS TABLE (id INT,name TEXT)
			|AS $$ BEGIN
			|	RETURN QUERY SELECT
			|		id,
			|		first_name || ' ' || last_name
			|	FROM people
			|	WHERE last_name = arg_last_name
			|	LIMIT 10;
			|END $$ LANGUAGE plpgsql;
	}
]
```

### Contributing

Clearly, I know very little about structuring a package for others' use, so feel free to suggest all those conventions...
