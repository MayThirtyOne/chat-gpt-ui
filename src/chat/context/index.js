import React, {
  useRef,
  useEffect,
  useReducer,
  useContext,
  createContext,
} from "react";
import action from "./action";
import reducer from "./reducer";
import { initState } from "./initState";

export const ChatContext = createContext(initState);
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initState);
  const actionList = action(state, dispatch);
  const latestState = useRef(state);

  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem("SESSIONS"));
    if (savedState) {
      dispatch({ type: "SET_STATE", payload: savedState });
    }
  }, []);

  useEffect(() => {
    const stateToSave = latestState.current;
    localStorage.setItem("SESSIONS", JSON.stringify(stateToSave));
  }, []);

  return (
    <ChatContext.Provider value={{ ...state, ...actionList, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useGlobal = () => useContext(ChatContext);