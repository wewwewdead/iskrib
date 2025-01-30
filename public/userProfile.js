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


//handling the follower button for showing follower names of the clicked user
document.addEventListener('DOMContentLoaded', () => {

    const follower_dialog = document.getElementById('follower-dialog');
    document.addEventListener('click', (e)=> {
        if(e.target.classList.contains('follower-btn')) {
            follower_dialog.classList.remove('hidden');
        }
        if(e.target === follower_dialog){
            follower_dialog.classList.add('hidden');
        }
    })
})

//handling the following button to show the users following
document.addEventListener('DOMContentLoaded', () =>{
    const following_dialog = document.getElementById('following-dialog');
    document.addEventListener('click', (e)=> {
        if(e.target.classList.contains('following-btn')) {
            following_dialog.classList.remove('hidden');
        }
        if(e.target === following_dialog) {
            following_dialog.classList.add('hidden');
        }
    })
})

document.addEventListener('DOMContentLoaded', () => { //handling the follow/ unfollow button
    document.addEventListener('click', async(e)=> {
        if(e.target.closest('.follow')) {
            e.preventDefault();
            console.log(e.target)
            const button = e.target
            const userId = button.getAttribute('data-user-id');

            try {
                const response = await fetch(`/api/users/${userId}/follow`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if(response.ok) {
                    const data = await response.json();
                    const followBtn = document.getElementById(`follow-btn-${userId}`);
                    followBtn.textContent = data.following ? 'Unfollow' : 'Follow';

                    //update follower count
                    // const followerCountElement = document.querySelector('.follower_count');
                    // if(followerCountElement) {
                    //     const followerCount = parseInt(followerCountElement.textContent, 10); //converts the string in to integer in 10 base decimal format
                    //     followerCountElement.textContent = data.following ? followerCount + 1 :followerCount - 1
                    // } else {
                    //     console.log('error')
                    // }
                }
            } catch (error) {
                console.error('Error toggling follow:', error);
            }
        }
    })
  })