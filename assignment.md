Drag and Drop thaught process

User can initiate a drag and drop by clicking in the center area of the card.

First problem was to identify weather the user clicks initially, should the click be taken as "dragstart"
or the actual "click".

The solution that I came up with was-
Attach a listener on "mousemove"  
If the mousemove is triggered with left mouse button being pressed (`event.buttons == 1`)
then it is a drag event  
If not, then user is simply moving the mouse.

User can drag for 2 things

- To move the card around
- To expand the card

To figure out which action should happen when the user drags, I am saving the `focusedCardButton`
in the `dragMeta` state.  
`focusedCardButton === expandButton` means user is dragging to expand the card.
`focusedCardButton === ""` means user is dragging to move the card.

When the user is dragging the card to move around, I do not want the card to snap at `event.x` and `event.y` -- that would lead to a jerk in the card.
I want to maintain the relative distance between the event coordinates and the card top, left.  
To do that, I am saving the card position at the time of drag start (top, left, height, width)
as well as the starting point of drag (event.x and event.y) `dragMeta` state.

Now, when the user is dragging,
we can find out the delta x between the most recent event.x and inital event.x and add that delta to initial card.left. ( and same for y coordinate )  
That way, user can scroll with a smooth UX.

Once the user releases the left mouse button (`event.buttons !== 1`), I am resetting the state `dragMeta` to note that the user has stopped dragging

Deployed Link: https://canvas-cards.web.app/
