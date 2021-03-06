const util = require('util')

module.exports = function nodePgProcedures(schema, logger){
		if(!schema || ! schema.filter || !schema.map || !schema.reduce){
				throw "Expected a schema array"
			}
		const sql = sqlFromSchema(schema)
		const methods = methodsFromSchema(schema, logger)
		return {
				sql: sql,
				methods: methods,
				auto: auto //An over-opinionated way to quickly use the above two
			}

		function auto(db){
				if(methods.query){throw 'Overwriting the query method is not supported'}
				Object.assign(db,methods)
				return sql.reduce(
						(chain,sql) => chain.then(
								() => db
										.query(sql)
										.catch(e=>{logger.error(sql.split("\n")[0].slice(0,80)+"..."); throw e;})
							)
						,
						Promise.resolve()
					)
			}

		function sqlFromSchema(schema){
				return schema.filter(s=>s.sql).map(s=>
						(s.procedure
						? "CREATE OR REPLACE FUNCTION "+s.procedure
								+ "("
								+ s.parameters.map(p=>"arg_"+p.name+" "+p.type).join(", ")
								+ ") "
						:"")
						+ s.sql
					)
			}

		function methodsFromSchema(schema, logger){
			var returnValue={}
			if(logger){
					returnValue.logquery = function query(str,arr){
							logger.info("Query",arr)
							return this.query(str,arr).then(logResult("Query"))
						}
				}
			schema.filter(s=>s.procedure).forEach(schema=>{
					const procedureName = schema.procedure
					const params = schema.parameters.map(p=>p.name)
					returnValue[procedureName] = function (argsObj){
							logger && logger.info(procedureName,argsObj)
							const missing = params
									.filter(p=>p.default===undefined)
									.filter(p=>argsObj[p]===undefined)
							if(missing.length){throw (new Error(
									"Procedure "+procedureName+" requires "+missing.join(", ")
									+"; Received "+Object.keys(argsObj).filter(k=>argsObj[k]!==undefined).join(", ")
								))}
							const addl=Object.keys(argsObj).filter(k=>!~params.indexOf(k))
							if(addl.length){logger.warn("PG Procedures: "+procedureName+" extraneous arguments: "+addl.join(", "))}
							return this.query(
									"SELECT * FROM "+procedureName+"("+params.map((x,i)=>"$"+(i+1)).join(", ")+")",
									params.map(p=>argsObj[p]!==undefined?argsObj[p]:p.default)
								).then(logResult(procedureName))
						}
				})

			return returnValue;

			function logResult(procedureName){
					return function(result){
							logger.info(
									"> "+procedureName+" ("+result.rows.length+") ",
									util.inspect(result.rows[0]||"", {colors:true})
								)
							return result
						}
				}
			}



}
