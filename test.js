const pgproc = require('./index.js')
const schema = [{
		description:"Plain procedure with no parameters",
		procedure: "plain",
		parameters:[],
		sql: "LOREM IPSUM",
		expected:{query:"CREATE OR REPLACE FUNCTION plain() LOREM IPSUM"},
		calls:[{
				description:"Plain procedure call with no arguments",
				arguments:{},
				expected:{query:"SELECT * FROM plain()", info:true}
			},{
				description:"Plain procedure call with extraneous argument",
				arguments:{foo:"bar"},
				expected:{query:"SELECT * FROM plain()",info:true,warn:true}
			}]
	}/*Let's get the basic cases working first,{
		description: "query is a reserved property",
		procedure: "query",
		sql: "x",
		expected:{exception:true}
	}*/]

var co,db
!async function(){
for(let s of schema){
		co={}, db={}
		db.query= expect(s.description,s.expected,'query')
		co.log 	= expect(s.description,s.expected,'log')
		co.warn = expect(s.description,s.expected,'warn')
		co.error= expect(s.description,s.expected,'error')
		co.info = expect(s.description,s.expected,'info')
		try{await pgproc([s],co).auto(db)}
		catch(e){ expect(s.description,s.expected,'exception')(e.message)}
		for(let c of s.calls){
				db.query= expect(c.description,c.expected,'query')
				co.log 	= expect(c.description,c.expected,'log')
				co.warn = expect(c.description,c.expected,'warn')
				co.error= expect(c.description,c.expected,'error')
				co.info = expect(c.description,c.expected,'info')
				try{await db[s.procedure](c.arguments)}
				catch(e){ expect(c.description,c.expected,'exception')(e.message)}
			}
	}
}()

function expect(description, expectations, type){
		var desc = (description||"").slice(0,75)
		var expected = expectations[type]
		return function(received){
				var state="";
				if(!state && expected===true){state="OK"}
				if(!state && !expected){state="ERR"}
				if(!state && expected.test && expected.test(received)){state="OK"}
				if(!state && expected.test && !expected.test(received)){state="ERR"}
				if(!state && received==expected){state="OK"}
				if(!state && received!=expected){state="ERR"}

				if(state=="OK"){
						console.log("OK	"+desc+" ("+type+")")
					}
				if(state=="ERR"){
						console.error("ERR	"+desc
								+"\n>	Expected "+type+":\t"+(''+expected).slice(0,75)
								+"\n>	Received "+type+":\t"+(''+received).slice(0,75)
							)
					}
				return type=="query"&&Promise.resolve({rows:[]})
			}
	}
