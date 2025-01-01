const sidebar = document.querySelector('.sidebar-desktop');
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