@preprocessor typescript

main -> cmd params _ {% d => [d[0], d[1]]%}
	  | cmd _ {% d => [d[0]] %}

cmd -> cmdToken {% d => d.join('').trim() %}

params -> param:+ {% d => ({...d[0].reduce((all, dd) => ({...all, ...dd}), {})}) %}

param -> paramName {% d => ({[d[0]]: null}) %}
	   | paramName __ paramVal {% d => ({[d[0]]: d[2]}) %}

paramName -> __ FLAG_START [^- ]:+ {% d => d[2].join('').trim() %}

paramVal -> paramValToken {% id %}

FLAG_START -> _ "-" {% null %}

cmdToken -> [^- ] [^-]:+ [^- ] {% d => [d[0], d[1].join(''), d[2]].join('') %}
paramValToken -> [^- ]:+ {% d => d[0].join('') %}

_ -> [ ]:* {% () => null %}
__ -> [ ] {% () => null %}
