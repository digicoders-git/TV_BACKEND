// src/redux/store.js
import { configureStore,combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from 'redux-persist/lib/storage'; // Use localStorage (default) or sessionStorage if needed
import authReducer from './features/authSlice.jsx';



const rootReducer=combineReducers({
  auth:authReducer,
})


// Persist configuration
const persistConfig = {
  key: 'root',
  storage, // sessionStorage or localStorage
  whitelist: ['auth']
};
const persistedReducer = persistReducer(persistConfig, rootReducer)
const store = configureStore({
  reducer:persistedReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
export default store;
