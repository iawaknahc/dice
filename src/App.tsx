import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useEffect,
} from "react";
import styles from "./App.module.scss";

interface RenderConfiguration {
  sort: boolean;
  redDice: boolean[];
}

type Combination = number[];

const valueToUnicode: string[] = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const RenderContext = createContext<RenderConfiguration>({
  sort: true,
  redDice: [false, true, false, false, true, false, false],
});

function NewCombinationInput({
  onClickDie,
  onClickClearAll,
  onClickCancelDie,
  newCombination,
}: {
  onClickDie: (e: React.MouseEvent<HTMLElement>, value: number) => void;
  onClickClearAll: (e: React.MouseEvent<HTMLElement>) => void;
  onClickCancelDie: (e: React.MouseEvent<HTMLElement>, index: number) => void;
  newCombination: Combination;
}) {
  const renderConfig = useContext(RenderContext);
  const buttons = [];
  for (let i = 1; i <= 6; i++) {
    const red = renderConfig.redDice[i];
    buttons.push(
      <button
        key={i}
        style={{
          color: red ? "red" : "black",
        }}
        className={styles.dieButton}
        onClick={e => {
          onClickDie(e, i);
        }}
      >
        {valueToUnicode[i]}
      </button>
    );
  }
  const pending = [];
  for (let i = 0; i < newCombination.length; i++) {
    const die = newCombination[i];
    const red = renderConfig.redDice[die];
    pending.push(
      <button
        key={i}
        style={{
          color: red ? "red" : "black",
        }}
        className={styles.dieButton}
        onClick={e => {
          onClickCancelDie(e, i);
        }}
      >
        {valueToUnicode[die]}
      </button>
    );
  }

  return (
    <div className={styles.input}>
      <div className={styles.dice}>{buttons}</div>
      <div className={styles.clear}>
        <button className={styles.clearButton} onClick={onClickClearAll}>
          {"Clear All Combinations"}
        </button>
      </div>
      <div className={styles.pending}>{pending}</div>
    </div>
  );
}

function CombinationList({
  combinations,
  onClickDelete,
}: {
  combinations: Combination[];
  onClickDelete: (e: React.MouseEvent<HTMLElement>, index: number) => void;
}) {
  const renderConfig = useContext(RenderContext);

  if (combinations.length <= 0) {
    return <div className={styles.list}>{"No combinations yet"}</div>;
  }

  const cells = [];
  for (let i = 0; i < combinations.length; ++i) {
    const c = combinations[i];
    const subcells = [];
    for (let j = 0; j < c.length; ++j) {
      const v = c[j];
      const red = renderConfig.redDice[v];
      subcells.push(
        <div
          key={j}
          style={{
            color: red ? "red" : "black",
          }}
          className={styles.subcell}
        >
          {valueToUnicode[v]}
        </div>
      );
    }
    cells.push(
      <div key={i} className={styles.cell}>
        <div className={styles.cellNumber}>{i + 1}</div>
        {subcells}
        <button
          className={styles.deleteButton}
          onClick={e => {
            onClickDelete(e, i);
          }}
        >
          {"␡"}
        </button>
      </div>
    );
  }

  return <div className={styles.list}>{cells}</div>;
}

interface State {
  combinations: Combination[];
  newCombination: Combination;
}

function App() {
  const [state, setState] = useState<State>({
    combinations: [],
    newCombination: [],
  });

  // Restore state
  useEffect(() => {
    try {
      const valueStr = localStorage.getItem("AppState");
      if (valueStr != null) {
        const value = JSON.parse(valueStr);
        setState(value);
      }
    } catch {}
  }, []);

  // Store state
  useEffect(() => {
    try {
      const valueStr = JSON.stringify(state);
      localStorage.setItem("AppState", valueStr);
    } catch {}
  }, [state]);

  const onClickDie = useCallback(
    (e: React.MouseEvent<HTMLElement>, value: number) => {
      e.preventDefault();
      e.stopPropagation();
      setState(prevState => {
        if (prevState.newCombination.length === 2) {
          const newCombination = [...prevState.newCombination, value].sort();
          return {
            ...prevState,
            combinations: prevState.combinations.concat([newCombination]),
            newCombination: [],
          };
        }
        return {
          ...prevState,
          newCombination: prevState.newCombination.concat([value]),
        };
      });
    },
    []
  );

  const onClickCancelDie = useCallback(
    (e: React.MouseEvent<HTMLElement>, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setState(prevState => {
        return {
          ...prevState,
          newCombination: [
            ...prevState.newCombination.slice(0, index),
            ...prevState.newCombination.slice(index + 1),
          ],
        };
      });
    },
    []
  );

  const onClickDelete = useCallback(
    (e: React.MouseEvent<HTMLElement>, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setState(prevState => {
        return {
          ...prevState,
          combinations: [
            ...prevState.combinations.slice(0, index),
            ...prevState.combinations.slice(index + 1),
          ],
        };
      });
    },
    []
  );

  const onClickClearAll = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const needConfirm = state.combinations.length > 0;
      // eslint-disable-next-line
      const proceed = !needConfirm || confirm("Are you sure to clear all?");
      if (proceed) {
        setState(prevState => {
          return {
            newCombination: [],
            combinations: [],
          };
        });
      }
    },
    [state]
  );

  return (
    <div className={styles.app}>
      <NewCombinationInput
        newCombination={state.newCombination}
        onClickDie={onClickDie}
        onClickClearAll={onClickClearAll}
        onClickCancelDie={onClickCancelDie}
      />
      <CombinationList
        combinations={state.combinations}
        onClickDelete={onClickDelete}
      />
    </div>
  );
}

export default App;
