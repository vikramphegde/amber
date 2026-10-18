const actions = {
  tiny: [
    { id: 'tiny-water', text: 'Take a sip of water.' },
    { id: 'tiny-feet', text: 'Put both feet on the floor and notice the support.' },
    { id: 'tiny-window', text: 'Look out a window and name one thing you see.' },
  ],
  small: [
    { id: 'small-stretch', text: 'Stretch your shoulders for a minute.' },
    { id: 'small-wash', text: 'Wash your face or brush your teeth.' },
    { id: 'small-text', text: 'Send someone a simple “hey, thinking of you.”' },
  ],
  stretch: [
    { id: 'stretch-walk', text: 'Take a five-minute walk, even just to the end of the block.' },
    { id: 'stretch-phone', text: 'Leave your phone to charge across the room while you get ready for bed.' },
    { id: 'stretch-snack', text: 'Make a small snack or a warm drink.' },
  ],
}

export const allowedActionIds = Object.values(actions).flat().map(({ id }) => id)

export default actions
