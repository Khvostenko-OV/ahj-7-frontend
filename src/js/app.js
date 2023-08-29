//const wsURL = 'ws://localhost:7070/ws';
const wsURL = 'ws://my-first-chat-w7js.onrender.com';

const login = document.querySelector('.login_send');
const loginInput = document.querySelector('.login_input');
//loginInput.value = localStorage.getItem('chatNickname');
const chat = document.querySelector('.chat');
const chatMembers = document.querySelector('.chat_members');
const chatInput = chat.querySelector('.chat_input');
const chatFeed = chat.querySelector('.chat_feed');
const chatClose = chat.querySelector('.chat_close');

let myName;
let ws;

function loginPrompt(prompt='') {
  document.querySelector('.login_prompt').textContent = prompt;
}

function serverMessage(prompt) {
  chatFeed.innerHTML += `<div class="server_message">${prompt}</div>`;
  chatFeed.scrollTop = chatFeed.scrollHeight;
}
  
function chatMessage(data) {
  if (data.type === 'members') {
    serverMessage(`${data.message}, ${data.time}`);
    
    chatMembers.innerHTML = `
    <div class="member_avatar"></div>
    <div class="member_nick self">You</div>
    `;

    data.members.filter(nick => nick !== myName).forEach(element => {
      chatMembers.innerHTML += `
        <div class="member_avatar"></div>
        <div class="member_nick">${element}</div>
      `;
    });
    return;
  }
  
  if (data.type === 'message') {
    let div = document.createElement('div');
    if (data.author === myName) {
      div.className = 'author myself';
      div.textContent = `You, ${data.time}`;
    } else {
      div.className = 'author';
      div.textContent = `${data.author}, ${data.time}`;
    }
    chatFeed.appendChild(div);

    div = document.createElement('div');
    div.className = 'message';
    if (data.author === myName) { div.classList.add('myself'); }
    div.textContent = data.message;
    chatFeed.appendChild(div);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }
} // chatMessage

function loginMessage(data) {
  if (data.result !== 'ok') {
    loginPrompt(data.prompt);
    ws.onclose = undefined;
    ws.close();
    return;
  }
//    localStorage.setItem('chatNickname', myName);
  loginPrompt();
  document.querySelector('.chat_name').textContent = data.title
  login.parentElement.style.display = 'none';
  chat.style.display = 'inline-block';
  const { top, left } = chat.getBoundingClientRect();
  chatMembers.style.left = left - 235 + 'px';
  chatMembers.style.top = top + 20 + 'px';
  chatMembers.style.display = 'flex';
  chatInput.focus();

  ws.onopen= undefined;
  ws.onerror = (e) => { console.log(e); serverMessage('Ошибка соединения!') };
  ws.onclose = () => { serverMessage('Сервер разорвал соединение!') };
  ws.onmessage = (e) => { chatMessage(JSON.parse(e.data)) };

} // loginMessage

login.addEventListener('click', () => {
  if (!loginInput.value) return;

  myName = loginInput.value;

  ws = new WebSocket(wsURL);
  ws.onerror = () => { loginPrompt('Ошибка соединения!'); };
  ws.onclose = () => { loginPrompt('Ошибка соединения!'); };
  ws.onopen = () => { ws.send(JSON.stringify({ type: 'join', nickname: myName })) };
  ws.onmessage = (e) => { loginMessage(JSON.parse(e.data)) };
});

chatInput.addEventListener('keydown', (e) => {
  if (e.keyCode === 13 && chatInput.value) {
    if (ws.readyState === 3) {
      serverMessage('Сервер разорвал соединение!');
      return;
    }
    ws.send(JSON.stringify({type: 'message', author: myName, message: chatInput.value}));
    chatInput.value = '';
  }
});

chatClose.addEventListener('click', () => {
  ws.onclose = undefined;
  ws.close();

  chatMembers.style.display = 'none';
  chat.style.display = 'none';
  chatFeed.innerHTML = '';
  chatInput.value = '';
  login.parentElement.style.display = 'block';
});
