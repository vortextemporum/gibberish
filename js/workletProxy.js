const serialize = require('serialize-javascript')

const replaceObj = obj => {
  if( typeof obj === 'object' && obj.id !== undefined ) {
    if( obj.__type !== 'seq' ) {
      return { id:obj.id }
    }else{
      return serialize( obj )
    }
  }
  return obj
}

const makeAndSendObject = function( __name, values, obj ) {
  const properties = {}
  for( let key in values ) {
    if( typeof values[ key ] === 'object' && values[ key ].__meta__ !== undefined ) {
      properties[ key ] = values[ key ].__meta__
    }else if( Array.isArray( values[ key ] ) ) {
      const arr = []
      for( let i = 0; i < values[ key ].length; i++ ) {
        arr[ i ] = replaceObj( values[ key ][i] )
      }
      properties[ key ] = arr
      console.log( 'array', key, arr )
    }else if( typeof values[key] === 'object' ){
      properties[ key ] = replaceObj( values[ key ] )
    }else{
      properties[ key ] = values[ key ]
    }
  }

  let serializedProperties = serialize( properties )

  if( Array.isArray( __name ) ) {
    const oldName = __name[ __name.length - 1 ]
    __name[ __name.length - 1 ] = oldName[0].toUpperCase() + oldName.substring(1)
  }else{
    __name = [ __name[0].toUpperCase() + __name.substring(1) ]
  }

  obj.__meta__ = {
    address:'add',
    name:__name,
    properties:serializedProperties, 
    id:obj.id
  }

  //console.log( obj.__meta__ )

  Gibberish.worklet.port.postMessage( obj.__meta__ )

}

module.exports = function( __name, values, obj ) {

  if( Gibberish.mode === 'worklet' && Gibberish.preventProxy === false ) {

    makeAndSendObject( __name, values, obj )

    // proxy for all method calls to send to worklet
    const proxy = new Proxy( obj, {
      get( target, prop, receiver ) {
        if( typeof target[ prop ] === 'function' && prop.indexOf('__') === -1) {
          const proxy = new Proxy( target[ prop ], {
            apply( __target, thisArg, args ) {
              const __args = args.map( replaceObj )
              //if( prop === 'connect' ) console.log( 'proxy connect:', __args )

              Gibberish.worklet.port.postMessage({ 
                address:'method', 
                object:obj.id,
                name:prop,
                args:__args
              })

              return target[ prop ].apply( thisArg, args )
            }
          })
          
          return proxy
        }

        return target[ prop ]
      },
      set( target, prop, value, receiver ) {
        Gibberish.worklet.port.postMessage({ 
          address:'set', 
          object:obj.id,
          name:prop,
          value:replaceObj( value )
        })

        target[ prop ] = value
      }
    })

    // XXX XXX XXX XXX XXX XXX
    // REMEMBER THAT YOU MUST ASSIGNED THE RETURNED VALUE TO YOUR UGEN,
    // YOU CANNOT USE THIS FUNCTION TO MODIFY A UGEN IN PLACE.
    // XXX XXX XXX XXX XXX XXX

    return proxy
  }

  return obj
}