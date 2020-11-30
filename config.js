import * as firebase from 'firebase';
require('@firebase/firestore');
var firebaseConfig = {
    apiKey: "AIzaSyDrBJHl-FHhkMmfn8GKbzuX9eq2v4s7WdY",
    authDomain: "wily-app-b77c1.firebaseapp.com",
    databaseURL: "https://wily-app-b77c1.firebaseio.com",
    projectId: "wily-app-b77c1",
    storageBucket: "wily-app-b77c1.appspot.com",
    messagingSenderId: "87684847578",
    appId: "1:87684847578:web:ed126a59dffcb1057e92e3"
  };
  firebase.initializeApp(firebaseConfig);
   export default firebase.firestore();