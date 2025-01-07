function asteriskPassword(inputField) {
    inputField.type = 'password';
}
function removeAsterisk(inputField) {
    inputField.type = 'text';
}

const password = document.getElementById('password');
const myCheckbox = document.getElementById('myCheckbox');
const hidepassword = document.getElementById('hidepassword');

hidepassword.addEventListener('click', (e) => {
    if(hidepassword.contains(e.target)) {
        myCheckbox.checked = !myCheckbox.checked;
        if(myCheckbox.checked) {
            removeAsterisk(password); 
        } else {
            asteriskPassword(password);
        }
    }
})
myCheckbox.addEventListener('change', () => {
    if(myCheckbox.checked) {
        removeAsterisk(password); 
    } else {
        asteriskPassword(password);
    }
})

const sidebar = document.querySelector('.sidebar');
const navbutton = document.querySelector('.navbutton');

navbutton.addEventListener('click', () => {
    sidebar.classList.toggle('activate_sidebar');
})
document.addEventListener('click', e => {
    if(!sidebar.contains(e.target) && !navbutton.contains(e.target)) {
        sidebar.classList.remove('activate_sidebar');
    }
})
// password.addEventListener('focus', ()=> {
//     asteriskPassword(password);
// });
// password.addEventListener('blur', () => {
//     removeAsterisk(password);
// })