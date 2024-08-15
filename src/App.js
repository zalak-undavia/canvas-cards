import { useEffect, useRef, useState } from "react";
import "./App.css";

const cardConstants = {
  minHeight: 90,
  minWidth: 90,

  height: 100,
  width: 200,
  radius: 10,
  text: {
    size: 20,
    padding: 8,
    length: 5,
  },
  button: {
    size: 40,
  },
};

const isWithinButton = (button, x, y) => {
  const { left, top, width, height } = button;
  if (!(left <= x && x <= left + width)) {
    return false;
  }

  if (!(top <= y && y <= top + width)) {
    return false;
  }

  return true;
};

const createNewCardAbsolute = (left, top, width, height) => {
  return {
    top: top,
    left: left,
    height: height,
    width: width,
    showMoreButton: {
      top: top,
      left: left + width - cardConstants.button.size,
      height: cardConstants.button.size,
      width: cardConstants.button.size,
    },
    expandButton: {
      top: top + height - cardConstants.button.size,
      left: left + width - cardConstants.button.size,
      height: cardConstants.button.size,
      width: cardConstants.button.size,
    },
    connectButton: {
      top: top + height - cardConstants.button.size,
      left: left,
      height: cardConstants.button.size,
      width: cardConstants.button.size,
    },
    paths: [],
  };
};

const createNewCard = (x, y) => {
  return createNewCardAbsolute(
    x - cardConstants.width / 2,
    y - cardConstants.height / 2,
    cardConstants.width,
    cardConstants.height
  );
};

const mergeCards = (oldCard, newCard) => {
  return {
    ...oldCard,
    ...newCard,
    showMoreButton: {
      ...oldCard.showMoreButton,
      ...newCard.showMoreButton,
    },
    expandButton: {
      ...oldCard.expandButton,
      ...newCard.expandButton,
    },
    connectButton: {
      ...oldCard.connectButton,
      ...newCard.connectButton,
    },
    paths: [...oldCard.paths],
  };
};

const getCoordinates = (card, side) => {
  switch (side) {
    case "T":
      return { start: { x: card.left, y: card.top }, end: { x: card.left + card.width, y: card.top } };
    case "R":
      return {
        start: { x: card.left + card.width, y: card.top },
        end: { x: card.left + card.width, y: card.top + card.height },
      };
    case "B":
      return {
        start: { x: card.left + card.width, y: card.top + card.height },
        end: { x: card.left, y: card.top + card.height },
      };
    case "L":
      return { start: { x: card.left, y: card.top + card.height }, end: { x: card.left, y: card.top } };
  }
};

const getMiddlePoint = (start, end) => {
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
};

const getPath = (source, sourceDir, destination, destDir) => {
  const sourceM = getMiddlePoint(source.start, source.end);
  const destM = getMiddlePoint(destination.start, destination.end);

  if (sourceDir === "B" && destDir === "L") {
    const mid = { x: sourceM.x, y: destM.y };
    return [sourceM, mid, destM];
  } else if (sourceDir === "R" && destDir === "B") {
    const mid = { x: destM.x, y: sourceM.y };
    return [sourceM, mid, destM];
  } else if (sourceDir === "L" && destDir === "T") {
    const mid = { x: destM.x, y: sourceM.y };
    return [sourceM, mid, destM];
  } else if (sourceDir === "T" && destDir === "R") {
    const mid = { x: sourceM.x, y: destM.y };
    return [sourceM, mid, destM];
  }
};

const calculatePath = (source, destination) => {
  const leftDelta = destination.left - source.left;
  const topDelta = destination.top - source.top;

  if (leftDelta >= 0 && topDelta >= 0) {
    const sourceCoors = getCoordinates(source, "B");
    const destCoords = getCoordinates(destination, "L");
    const path = getPath(sourceCoors, "B", destCoords, "L");
    return path;
  } else if (leftDelta >= 0 && topDelta < 0) {
    const sourceCoors = getCoordinates(source, "R");
    const destCoords = getCoordinates(destination, "B");
    const path = getPath(sourceCoors, "R", destCoords, "B");
    return path;
  } else if (leftDelta < 0 && topDelta >= 0) {
    const sourceCoors = getCoordinates(source, "L");
    const destCoords = getCoordinates(destination, "T");
    const path = getPath(sourceCoors, "L", destCoords, "T");
    return path;
  } else if (leftDelta < 0 && topDelta < 0) {
    const sourceCoors = getCoordinates(source, "T");
    const destCoords = getCoordinates(destination, "R");
    const path = getPath(sourceCoors, "T", destCoords, "R");
    return path;
  }
};

const connect = (cards, sourceIdx, destIdx) => {
  if (sourceIdx === destIdx) {
    return;
  }

  const source = cards[sourceIdx];

  if (source.paths === undefined) {
    source.paths = [];
  }

  if (source.paths.indexOf(destIdx) < 0) {
    source.paths.push(destIdx);
  }
};

const getDisplayCardText = (card) => {
  if (card.text.length > cardConstants.text.length) {
    return card.text.substring(0, cardConstants.text.length) + "...";
  }
  return card.text;
};

function App() {
  const canvas = useRef();

  const [pointerPosition, setPointerPosition] = useState({
    x: undefined,
    y: undefined,
    buttons: -1,
  });

  const [pointerMeta, setPointerMeta] = useState({
    focusedCardIndex: -1,
    focusedCardButton: "",
  });

  const [showInput, setShowInput] = useState(false);
  const [cards, setCards] = useState([]);
  const [input, setInput] = useState("");

  const [dragMeta, setDragMeta] = useState({
    card: undefined,
    drag: undefined,
    focusedCardButton: undefined,
  });

  const [moreInfoShown, setMoreInfoShown] = useState(false);
  const [cardBeingConnected, setCardBeingConnected] = useState(undefined);

  const setCanvasToWindowSize = () => {
    canvas.current.height = window.innerHeight;
    canvas.current.width = window.innerWidth;
  };

  useEffect(() => {
    const { x, y, buttons } = pointerPosition;

    if (buttons === 1) {
      if (dragMeta.drag !== undefined) {
        const xDelta = x - dragMeta.drag.x;
        const yDelta = y - dragMeta.drag.y;
        // drag the card
        if (dragMeta.focusedCardButton === "") {
          setCards((cards) => {
            const newLeft = dragMeta.card.left + xDelta;
            const newTop = dragMeta.card.top + yDelta;
            const existingCard = cards[pointerMeta.focusedCardIndex];
            const newCard = createNewCardAbsolute(newLeft, newTop, existingCard.width, existingCard.height);
            const updatedCard = mergeCards(existingCard, newCard);
            cards[pointerMeta.focusedCardIndex] = updatedCard;
            return [...cards];
          });
        } else if (dragMeta.focusedCardButton === "expandButton") {
          setCards((cards) => {
            let newWidth = dragMeta.card.width + xDelta;
            let newHeight = dragMeta.card.height + yDelta;
            if (newWidth < cardConstants.minWidth) {
              newWidth = cardConstants.minWidth;
            }
            if (newHeight < cardConstants.minHeight) {
              newHeight = cardConstants.minHeight;
            }
            const existingCard = cards[pointerMeta.focusedCardIndex];
            const newCard = createNewCardAbsolute(dragMeta.card.left, dragMeta.card.top, newWidth, newHeight);
            const updatedCard = mergeCards(existingCard, newCard);
            cards[pointerMeta.focusedCardIndex] = updatedCard;
            return [...cards];
          });
        }
      }
    } else {
      let isPointerInsideAnyCard = false;
      let i;
      for (i = 0; i < cards.length && !isPointerInsideAnyCard; i++) {
        const card = cards[i];
        const isPointerWithinX = card.left <= x && x <= card.left + card.width;
        const isPointerWithinY = card.top <= y && y <= card.top + card.height;

        isPointerInsideAnyCard = isPointerWithinX && isPointerWithinY;
      }

      const meta = {
        focusedCardIndex: -1,
        focusedCardButton: "",
      };

      if (isPointerInsideAnyCard) {
        const cardIndex = i - 1;
        const card = cards[cardIndex];

        meta.focusedCardIndex = cardIndex;

        const { expandButton, showMoreButton, connectButton } = card;

        if (isWithinButton(expandButton, x, y)) {
          meta.focusedCardButton = "expandButton";
        } else if (isWithinButton(showMoreButton, x, y)) {
          meta.focusedCardButton = "showMoreButton";
        } else if (isWithinButton(connectButton, x, y)) {
          meta.focusedCardButton = "connectButton";
        }
      }

      setPointerMeta(meta);
    }
  }, [pointerPosition, showInput, dragMeta]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (dragMeta.drag === undefined) {
        if (e.buttons === 1) {
          setDragMeta({
            focusedCardButton: pointerMeta.focusedCardButton,
            drag: { x: e.x, y: e.y },
            card: JSON.parse(JSON.stringify(cards[pointerMeta.focusedCardIndex])),
          });
        }
      } else {
        if (e.buttons !== 1) {
          setDragMeta({ drag: undefined, card: undefined });
        }
      }

      setPointerPosition({ x: e.x, y: e.y, buttons: e.buttons });
    };

    if (moreInfoShown) return;
    if (showInput) return;
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [cards, moreInfoShown, dragMeta, pointerMeta]);

  useEffect(() => {
    const ctx = canvas.current.getContext("2d");
    ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      ctx.beginPath();
      ctx.roundRect(card.left, card.top, card.width, card.height, cardConstants.radius);
      ctx.stroke();

      if (card.text) {
        ctx.font = `${cardConstants.text.size}px sans-serif`;
        const text = getDisplayCardText(card);

        ctx.fillText(
          text,
          card.left + cardConstants.text.padding,
          card.top + cardConstants.text.size + cardConstants.text.padding
        );

        // show more button
        ctx.beginPath();
        ctx.roundRect(
          card.showMoreButton.left,
          card.showMoreButton.top,
          card.showMoreButton.width,
          card.showMoreButton.height,
          cardConstants.radius
        );
        ctx.stroke();

        // expand button
        ctx.beginPath();
        ctx.roundRect(
          card.expandButton.left,
          card.expandButton.top,
          card.expandButton.width,
          card.expandButton.height,
          cardConstants.radius
        );
        ctx.stroke();

        // connect with other card button
        ctx.beginPath();
        ctx.roundRect(
          card.connectButton.left,
          card.connectButton.top,
          card.connectButton.width,
          card.connectButton.height,
          cardConstants.radius
        );
        ctx.stroke();
      }
      if (card.paths && card.paths.length !== 0) {
        for (let j = 0; j < card.paths.length; j++) {
          const source = cards[card.paths[j]];
          const dest = card;
          const aPath = calculatePath(source, dest);
          if (aPath) {
            ctx.beginPath();
            ctx.moveTo(aPath[0].x, aPath[0].y);
            for (let k = 1; k < aPath.length; k++) {
              const aPathPoint = aPath[k];
              ctx.lineTo(aPathPoint.x, aPathPoint.y);
            }
            ctx.stroke();
          }
        }
      }
    }
  }, [cards]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (showInput) return;
      const { focusedCardButton, focusedCardIndex } = pointerMeta;
      if (focusedCardIndex < 0) {
        setCards((cards) => [...cards, createNewCard(e.x, e.y)]);
        setShowInput(true);
      } else if (focusedCardButton) {
        if (focusedCardButton === "showMoreButton") {
          setMoreInfoShown(true);
        } else if (focusedCardButton === "connectButton") {
          if (cards.length >= 2) {
            if (cardBeingConnected === undefined) {
              setCardBeingConnected(focusedCardIndex);
            } else {
              setCards((cards) => {
                connect(cards, focusedCardIndex, cardBeingConnected);
                return [...cards];
              });
              setCardBeingConnected(undefined);
            }
          } else {
            alert("can not connect when there is only 1 card");
          }
        }
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [pointerMeta, showInput, cardBeingConnected]);

  useEffect(() => {
    setCanvasToWindowSize();
  }, []);

  const onCardSubmit = (e) => {
    e.preventDefault();
    const cardToEdit = cards[cards.length - 1];
    cardToEdit.text = input;
    setCards([...cards]);
    setInput("");
    setShowInput(false);
  };

  const pointerClass = () => {
    if (moreInfoShown) return "";
    if (showInput) return "";
    if (pointerMeta.focusedCardIndex < 0) return "";
    if (pointerMeta.focusedCardButton) {
      return `pointer-${pointerMeta.focusedCardButton}`;
    }
    return "pointer-grab";
  };

  const getHelpText = () => {
    if (cardBeingConnected !== undefined) {
      return `Select another card to connect with ${getDisplayCardText(cards[cardBeingConnected])}`;
    }

    if (moreInfoShown) {
      return "Hide the info to continue";
    }
    if (pointerMeta.focusedCardIndex < 0) {
      return "Click to add a new card";
    }

    if (showInput) {
      return "Fill in the card text to continue";
    }

    if (pointerMeta.focusedCardButton === "showMoreButton") {
      return `Click to show more info of ${getDisplayCardText(cards[pointerMeta.focusedCardIndex])}`;
    }

    if (pointerMeta.focusedCardButton === "expandButton") {
      return `Drag to expand ${getDisplayCardText(cards[pointerMeta.focusedCardIndex])}`;
    }

    if (pointerMeta.focusedCardButton === "connectButton") {
      return `Click to initiate connection for ${getDisplayCardText(cards[pointerMeta.focusedCardIndex])}`;
    }

    if (pointerMeta.focusedCardButton === "") {
      return `Drag to move ${getDisplayCardText(cards[pointerMeta.focusedCardIndex])}`;
    }
  };

  const help = getHelpText();
  return (
    <div className={pointerClass()}>
      {showInput && (
        <form onSubmit={onCardSubmit}>
          <label
            className="card-text-input"
            style={{
              top: cards[cards.length - 1].top,
              left: cards[cards.length - 1].left,
            }}
          >
            Text:
            <input
              placeholder="Write something"
              required
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
        </form>
      )}
      {moreInfoShown && (
        <div
          className="more-info-container"
          style={{
            top: cards[pointerMeta.focusedCardIndex].top,
            left: cards[pointerMeta.focusedCardIndex].left + cards[pointerMeta.focusedCardIndex].width,
          }}
        >
          {cards[pointerMeta.focusedCardIndex].text}
          <div>
            <button onClick={() => setMoreInfoShown(false)}>Hide</button>
          </div>
        </div>
      )}
      {help && <div className="help">{help}</div>}
      <canvas ref={canvas}></canvas>
    </div>
  );
}

export default App;
