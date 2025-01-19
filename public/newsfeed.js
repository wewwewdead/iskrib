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




document.addEventListener('DOMContentLoaded', () => {
    // toggle comments visibility
    document.addEventListener('click', (e) => {
if (e.target.classList.contains('toggle-comments')) {
    const postId = e.target.getAttribute('data-id');
    const commentsContainer = document.getElementById(`comments-${postId}`);
    commentsContainer.classList.toggle('hidden');
    e.target.textContent = commentsContainer.classList.contains('hidden') ? 'Show Comments' : 'Hide Comments';

    // if user click outside the comments it will close the comment section
    document.addEventListener('click', (e) => {

// checking if the users click the comment-section <div></div>
if (!e.target.closest('.comments-section') && !e.target.closest('.add-comment')) {
    document.querySelectorAll('.comments-container').forEach(commentsContainer => {
        if (!commentsContainer.classList.contains('hidden')) {
            commentsContainer.classList.add('hidden');

            // find the  button using data-id
            const postId = commentsContainer.id.split('-')[1]; // extract post ID it will split the (id="comments-post.post_id") and return only the (post.post_id)
            const button = document.querySelector(`.toggle-comments[data-id="${postId}"]`);
            if (button) {
                button.textContent = 'Show Comments';
            }
        }
    });
}
});
}

});
   

    // add a new comment
    document.querySelectorAll('.add-comment-btn').forEach(button => {
        button.addEventListener('click', async () => {
            console.log('hi')
            const postId = button.getAttribute('data-id');
            const commentInput = document.getElementById(`comment-input-${postId}`);
            const commentContent = commentInput.value.trim(); //trim() method will remove white spaces of the text
            
            if (!commentContent) {
                alert('Comment cannot be empty!');
                return;
            }
            try {
                 const response = await fetch(`/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: commentContent }),
                });
                if (response.ok) {
                    const noComments = document.querySelector('.no-comments');
                    const newComment = await response.json();
                    const commentsContainer = document.getElementById(`comments-${postId}`);
                    const commentHTML = `
                    <div class="comment">
                                                <p>
                                                    <a href="/user/${newComment.user_id}" class="profile_link author"><small>${newComment.user.firstname} ${newComment.user.lastname}:</small></a>
                                                </p>
                                                <p class="content">${newComment.content}</p>
                                                <p class="publishDate">
                                                    <small>${new Date(newComment.created_at).toLocaleString()}</small>
                                                </p>
                                            </div>
                                            <button class="reply-btn" data-comment-id="${newComment.user_id}" data-user="${newComment.user.firstname} ${newComment.user.lastname}">Reply</button>`
                                            

                    if(noComments){
                        noComments.style.display = 'none';
                    }
                    
                    commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
                    commentInput.value = ''; // Clear input
                    if (commentsContainer.classList.contains('hidden')) {
                        commentsContainer.classList.remove('hidden');

                    }

                    //update the toggle button
                    const toggleButton = document.querySelector(`.toggle-comments[data-id="${postId}"]`)
                    if (toggleButton) {
                        toggleButton.textContent = 'Hide Comments';
                    }

                    } else {
                        console.error('Failed to add comment');
                        alert('Failed to add comment');}
            } catch (error) {
    console.error('Error adding comment:', error);
    alert('Error adding comment');
  }
});
});
});

//show replies
document.addEventListener('DOMContentLoaded', () => {
    // handle reply button click events
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('reply-btn')) {
            
            const commentId = e.target.getAttribute('data-comment-id'); // Get the ID of the comment
            const replyInput = document.querySelector(`.reply-input${commentId}`); // Select the reply input for the comment
            const repliesContainer = document.getElementById(`replies-${commentId}`); // Get the container for replies
            const showMoreContainer = document.getElementById(`showmore-${commentId}`);
            const showMoreButton = showMoreContainer.querySelector('.show-more-replies');

            if(e.target.textContent === 'show replies') {
                e.target.textContent = 'hide replies'
            } else {
                e.target.textContent = 'show replies'
            }

            // toggle the visibility of the reply input field
            if (replyInput) {
                replyInput.classList.toggle('hidden');
                setTimeout(() => replyInput.focus(), 100); // delay focus to ensure the input is visible
            }

            // show or hide the replies container and load replies if necessary
            if (repliesContainer.classList.contains('hidden')) {
                repliesContainer.classList.remove('hidden'); // Show replies container

                try {
                    // fetch replies from the server
                    const page = 1;
                     const result = await fetch(`/api/comments/${commentId}/replies`);
                     if (result.ok) {
                       const data = await result.json();
                       console.log(`check${data.totalPages}`)

                           repliesContainer.innerHTML = ''; // clear the container
                           // render each reply and append it to the container
                           data.replies.forEach(reply => {
                               const replyHtml = `
                               <div class="reply">
                               <p><a href="/user/${reply.user_id}" class="profile_link author">
                               <small><span>${reply.firstname} ${reply.lastname}:</small></span></a></p>
                               <p class="content_reply">${reply.content}</p>
                               <p class="publishDate"><small>${new Date(reply.created_at).toLocaleString()}</small></p>
                               </div>`;
                               repliesContainer.insertAdjacentHTML('beforeend', replyHtml);
                               
                           });

                           repliesContainer.dataset.page = 1;
                           repliesContainer.dataset.totalPages = data.totalPages;

                           // add "show more replies" button if there are more pages
                           if (data.totalPages > 1) {
                               const showMoreButton = showMoreContainer.querySelector('.show-more-replies')
                               showMoreButton.classList.remove('hidden')}
                       }

               } catch (error) {
                   console.error(`error loading  replies`, error);
               }

            } else {
                repliesContainer.classList.add('hidden'); // hide replies container
                showMoreButton.classList.add('hidden');
            }
        }

        // handle "show more replies" button click
    if (e.target.classList.contains('show-more-replies')) {
        const commentId = e.target.getAttribute('data-comment-id');
        const repliesContainer = document.getElementById(`replies-${commentId}`);
        const showMoreContainer = document.getElementById(`showmore-${commentId}`)


        if (repliesContainer) {
            let currentPage = parseInt(repliesContainer.dataset.page) || 1;
            const totalPages = parseInt(repliesContainer.dataset.totalPages) || 1;

            // fetch the next page of replies if there are more pages
            if (currentPage < totalPages) {
                currentPage += 1;

                // remove "show more replies" button if all pages are loaded 
                if (currentPage >= totalPages) {
                    const showMoreButton = showMoreContainer.querySelector('.show-more-replies');
                    showMoreButton.classList.add('hidden');
   
                }

                try {
                    const result = await fetch(`/api/comments/${commentId}/replies?page=${currentPage}`);
                    if (result.ok) {
                        const data = await result.json();

                        // render the new replies and append them to the container
                        data.replies.forEach(reply => {
                            const replyHtml = `
                                <div class="reply">
                                    <p><a href="/user/${reply.user_id}" class="profile_link author">
                                        <small>${reply.firstname} ${reply.lastname}:</small></a></p>
                                    <p class="content_reply">${reply.content}</p>
                                    <p class="publishDate"><small>${new Date(reply.created_at).toLocaleString()}</small></p>
                                </div>`;
                            repliesContainer.insertAdjacentHTML('beforeend', replyHtml);
                        });

                        // update the current page in the data attribute
                        repliesContainer.dataset.page = currentPage;

                        
                    }
                } catch (error) {
                    console.error('Error loading more replies:', error);
                }
            }
        }
    }

        
        
    });






    // handle reply submission
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('submit-reply-btn')) {
            e.preventDefault(); // prevent default form submission

            const commentId = e.target.getAttribute('data-comment-id'); // get the comment ID
            const replyInput = document.getElementById(`reply-input-${commentId}`); // get the reply input field
            const replyContent = replyInput.querySelector('.reply-comment-input').value.trim(); // get the reply content
            const userId = e.target.getAttribute('data-user-id'); // get the user ID
            const hideButton = document.getElementById(`button-${commentId}`);


            // validate that the reply content is not empty
            if (!replyContent) {
                alert('Reply cannot be empty!'); // alert the user
                return;
            }

            try {
                // send the reply to the server
                const response = await fetch(`/api/comments/${commentId}/get/replies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: replyContent, userId: userId }),
                });

                if (response.ok) {
                    const data = await response.json(); //parse the response data
                    const repliesContainer = document.getElementById(`replies-${commentId}`); // get the replies container
                    // append the newly created reply to the container
                    const replyHTML = `
                        <div class="reply">
                            <p>
                                <a href="/user/${data.userData.id}" class="profile_link author reply_author">
                                    <small>${data.userData.firstname} ${data.userData.lastname}:</small>
                                </a>
                            </p>
                            <p class="content_reply">${data.content}</p>
                            <p class="publishDate">
                                <small>${new Date(data.created_at).toLocaleString()}</small>
                            </p>
                        </div>
                    `;
                    repliesContainer.insertAdjacentHTML('beforeend', replyHTML);

                    // clear the input field and hide it
                    replyInput.querySelector('.reply-comment-input').value = '';
                    replyInput.classList.add('hidden');
                    repliesContainer.classList.remove('hidden');
                    hideButton.textContent = 'hide replies'
                } else {
                    alert('Failed to submit reply'); // alert the user in case of failure
                }
            } catch (error) {
                console.error('Error submitting reply:', error); // log any errors during submission
                alert('Error submitting reply'); // notify the user
            }
        }
    });
});
  




//for toggling readmore dynamically
document.addEventListener('DOMContentLoaded', () => {
    const posts = document.querySelectorAll('.newsfeed');
    
    
    posts.forEach(post => {
        post.addEventListener('click', async(e)=> {

            if(e.target.classList.contains('read-more')) {
                e.preventDefault();
                const postId = e.target.getAttribute('data-id');
                const contentElement = post.querySelector('.content');
            
                try {
                    // fetch the post from database
                    const response = await fetch(`/api/posts/${postId}`);
                    if(response.ok) {
                        const post = await response.json();
                        

                        // update the content or post
                        contentElement.textContent = post.content;
                        contentElement.style.whiteSpace = 'pre-wrap';
                        e.target.textContent = "Read Less";
                        e.target.classList.remove('read-more');
                        e.target.classList.add('read-less');
                    }
                } catch (error) {
                    console.error('Error fetching post content:', error); //.substring(0, 200)
                }
            } else if (e.target.classList.contains('read-less')) {
            e.preventDefault();

            const postId = e.target.getAttribute('data-id');
            const postElements = e.target.parentElement;

            // shortened the  text to first 200 characters
            const fullContent = postElements.querySelector('.content').textContent;
            const shortenedText = `${fullContent.substring(0, 200)}...`; //cut the post into first 200 characters
            postElements.querySelector('.content').textContent = shortenedText;
            postElements.querySelector('.content').style.whiteSpace = 'normal';

            // change button back to "Read More"
            e.target.textContent = "Read More";
            e.target.classList.remove('read-less');
            e.target.classList.add('read-more');
        }

        })
    });
})

document.addEventListener('click', async (e) => {
    console.log(e.target);
    if (e.target.classList.contains('like-btn')) {
        console.log('click')
      const button = e.target;
      const postId = button.getAttribute('data-post-id');
  
      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
  
        if (response.ok) {
          const data = await response.json();
          const likeCountElement = document.querySelector(`.like-id-${postId}`);

          if(likeCountElement){
            likeCountElement.textContent = data.like_count;
          }
  
          if (data.liked) {
            button.style.fill = 'rgb(227, 45, 45)'; //change color to red if users clicks like button
            
          } else {
            //remove color of the button if users unlike
            button.style.fill = '#E2F1E7';
          }
  
        } else {
          alert('Failed to toggle like.');
        }
      } catch (error) {
        console.error('Error toggling like:', error);
        alert('Error toggling like.');
      }
    }
  });
  






