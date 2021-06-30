import React, { useRef, useState } from "react";
import "./App.less";

/* FIREBASE */
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

/* HOOKS */
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

/* Инициализируем приложение через Firebase */
firebase.initializeApp({
  //config
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  /** Определяем, авторизован ли пользователь
   * @param (null | Object) user
   */
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>The coolest chat ever</h1>
        <SignOut />
      </header>
      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

/**
 *
 * @returns Функция SignIn рендерит кнопку Sign in with Google аккаунт, при клике на которую запускается колбэк функция signInWithGoogle
 */
function SignIn() {
  /**
   * Фукнция signInWithGoogle создает инстанс GoogleAuthProvider. Затем вызывается фукнция signInWithPopup, куда мы передаем наш provider и видим поп-ап со встроенным механизмом авторизации через Google
   */
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <button onClick={signInWithGoogle}>Sign in with Google account</button>
  );
}

/**
 * Функция SignOut проверяет авторизован ли пользователь. Если auth.currentUser === true, то рендерит кнопку Sign Out, при клике на которую пользователь разлогинивается
 *
 */
function SignOut() {
  return (
    auth.currentUser && <button onClick={() => auth.signOut()}>Sign Out</button>
  );
}

/**
 * Функция ChatRoom следит за обновлениями в базе сообщений firestore. Для каждого нового сообщения рендерится новое ChatMessage
 */
function ChatRoom() {
  const fake = useRef();
  const messagesRef = firestore.collection("messages");
  /**
   * Обращаемся к коллекции сообщений и выводим 25 последних сообщений
   */
  const query = messagesRef.orderBy("createdAt").limit(20);

  /** Следим за обновлениями сообщений в режиме реального времени с помощью хука useCollectionData
   */
  const [messages] = useCollectionData(query, { idField: "id" });

  const [formValue, setFormValue] = useState("");

  /**
   * Функция sendMessage запускается при событии клика на кнопку "Отправить", получает id и фото текущего пользователя и добавляет новое сообщение в базу сообщений firestore
   */
  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue("");

    fake.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        <div>
          {messages &&
            messages.map((msg) => (
              /**
               * Для каждого ChatMeassage используем свойства key = id сообщения  и message = тексту сообщения
               */
              <ChatMessage key={msg.id} message={msg} />
            ))}
        </div>
        <div ref={fake}></div>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
        />
        <button className="btn" type="submit">
          Send
        </button>
      </form>
    </>
  );
}

/**
 * Функция ChatMessage извлекает текст из props'a message и рендерит его в теге p

 */
function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  /**
   * messageClass определяет, должны ли мы отобразить сообщение как полученное или отправленное, с помощью сравнения id
   */
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} alt="avatar" />
      <p>{text}</p>
    </div>
  );
}

export default App;
