const ugen = require( '../ugen.js' )()

const instrument = Object.create( ugen )

Object.assign( instrument, {
  type:'instrument',

  note( freq ) {
    // if binop is should be used...
    if( isNaN( this.frequency ) ) { 
      // and if we are assigning binop for the first time...
      if( this.frequency.isop !== true ) {
        let obj = Gibberish.processor.ugens.get( this.frequency.id )
        obj.inputs[0] = freq
        this.frequency = obj
      }else{
        this.frequency.inputs[0] = freq
        Gibberish.dirty( this )
      }
    }else{
      this.frequency = freq
    }

    this.env.trigger()
  },

  trigger( gain = 1 ) {
    this.gain = gain
    this.env.trigger()
  },

})

module.exports = instrument
