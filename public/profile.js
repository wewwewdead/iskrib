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


document.addEventListener('DOMContentLoaded', () => {
    const deleteDialog = document.getElementById('deleteDialog');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');
    const deletePostButton = document.querySelectorAll('.delete-post');
    let postIdToDelete = null; // Declare the variable to store the post ID to delete

    // Open delete confirmation dialog
    deletePostButton.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link action
            postIdToDelete = button.getAttribute('data-id'); // Get the post ID from data-id attribute

            // Show the delete confirmation dialog
            deleteDialog.classList.remove('hidden');
        });
    });
    // Confirm delete action
    confirmDelete.addEventListener('click', async () => {
        try {
            // Send DELETE request to server
            const response = await fetch(`/delete/posts/${postIdToDelete}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                // Successfully deleted post
                const postElement = document.querySelector(`.profile_post[data-id="${postIdToDelete}"]`);
                
                if (postElement) {
    
                    postElement.remove(); // Remove post from DOM
                    } else {
                        console.log('Post element not found in DOM'); // Debug: Post element
                        }
                        
                // Hide the dialog
                deleteDialog.classList.add('hidden');
            } else {
                console.error('Failed to delete the post');
                alert('An error occurred while deleting the post.');
            }
        } catch (error) {
            console.error('Error deleting the post:', error);
            alert('An error occurred while deleting the post.');
        }
    });
    
    // Close delete confirmation dialog on cancel
    cancelDelete.addEventListener('click', () => {
    deleteDialog.classList.add('hidden'); // Hide the dialog
    });
    
    // Close dialog when clicking outside the dialog content
    deleteDialog.addEventListener('click', (e) => {
        if (e.target === deleteDialog) {
            deleteDialog.classList.add('hidden');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const profilePost = document.querySelectorAll('.profile_post');
    document.addEventListener('click', async(e) => {
        if(e.target.classList.contains('read-more')) {
            e.preventDefault();
            const postId = e.target.getAttribute('data-id');
            const postElements = document.getElementById(`post-id-${postId}`);

            try {
                //feth the post from database
                const response = await fetch(`/api/posts/${postId}`);
                if(response.ok) {
                    const post = await response.json();
                    // Update the content and remove the "Read More" link
                    postElements.innerHTML = post.content;    
                    postElements.style.whiteSpace = 'pre-wrap';
                    e.target.textContent = 'Read less'  
                    e.target.classList.add('read-less');       
                    e.target.classList.remove('read-more');   
                }
            } catch (error) {
                console.error('Error fetching post content:', error);
            }
        } else if(e.target.classList.contains('read-less')) {
            e.preventDefault();
            const postId = e.target.getAttribute('data-id');
            const postElements = document.getElementById(`post-id-${postId}`);
            const fullContent = postElements.textContent;
            const shortenedContent = `${fullContent.substring(0, 200)}...`; // shortened the  text to first 200 characters
            postElements.textContent = shortenedContent;
            postElements.style.whiteSpace = 'normal'

            // change button back to "Read More"
            e.target.textContent = "Read More";
            e.target.classList.remove('read-less');
            e.target.classList.add('read-more');
            
        }
    })
    })


document.addEventListener('DOMContentLoaded', () => {
const editDialog = document.getElementById('editDialog');
const editPostForm = document.getElementById('editPostForm');
const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const cancelEdit = document.getElementById('cancelEdit');

// open dialog and populate fields
document.querySelectorAll('.edit-post').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault(); // prevent default link action

        const postId = button.dataset.id;
        const postTitle = button.dataset.title;
        const postContent = button.dataset.content;

        editTitle.value = postTitle;
        editContent.value = postContent;
        editPostForm.action = `/posts/${postId}`; // set the form action dynamically

        editDialog.classList.remove('hidden'); // Show the dialog
    });
});

// Close dialog on cancel
cancelEdit.addEventListener('click', () => {
    editDialog.classList.add('hidden'); // Hide the dialog
});

// Close dialog when clicking outside the dialog content
editDialog.addEventListener('click', (e) => {
    if (e.target === editDialog) {
        editDialog.classList.add('hidden');
    }
});
});

//for dropdown settings in deleting and updating post
document.addEventListener('DOMContentLoaded', () =>{

    const settingButtons = document.querySelectorAll('.settings');
    const hide = document.querySelectorAll('.hide');

    settingButtons.forEach(settingButton => {
        settingButton.addEventListener('click', (e) => {
            e.stopPropagation();

            // find the dropdown menu
            const menu = settingButton.nextElementSibling;

            // hide all other dropdown menus
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

//handling the follower button for showing follower names of the clicked user
document.addEventListener('DOMContentLoaded', () => {

    const follower_dialog = document.getElementById('follower-dialog');
    document.addEventListener('click', (e)=> {
        if(e.target.classList.contains('follower-btn')) {
            e.stopPropagation();
            follower_dialog.classList.remove('hidden');
        }
        if(e.target === follower_dialog){
            e.stopPropagation();
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
