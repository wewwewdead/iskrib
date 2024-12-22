function asteriskPassword(inputField) {
    inputField.type = 'password';
}
function removeAsterisk(inputField) {
    inputField.type = 'text';
}

const password = document.getElementById('password');
const myCheckbox = document.getElementById('myCheckbox');

password.addEventListener('focus', () => {
    asteriskPassword(password);
})
myCheckbox.addEventListener('change', () => {
    if(password.type === 'password') {
        removeAsterisk(password); 
    } else {
        asteriskPassword(password);
    }
})
// password.addEventListener('focus', ()=> {
//     asteriskPassword(password);
// });
// password.addEventListener('blur', () => {
//     removeAsterisk(password);
// })