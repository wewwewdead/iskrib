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


//for dropdown settings in deleting and updating post
document.addEventListener('DOMContentLoaded', () =>{

    const settingButtons = document.querySelectorAll('.settings');
    const hide = document.querySelectorAll('.hide');

    settingButtons.forEach(settingButton => {
        settingButton.addEventListener('click', (e) => {
            e.stopPropagation();

            // Find the associated dropdown menu
            const menu = settingButton.nextElementSibling;

            // Hide all other dropdown menus
            hide.forEach(i => {
                if(i !== menu){
                    i.classList.remove('show');
                }    
            });
            // Toggle the clicked menu's visibility
            menu.classList.toggle('show');
        })
    });
    
    //close the dropwdown menu when clicking outside 
    document.addEventListener('click', (e) => {
        hide.forEach(i => {
            if(!i.contains(e.target)) {
                i.classList.remove('show');
            }
        });
    })
});







