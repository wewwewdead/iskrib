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
//handling the list of likers if user click the numbers of likers
document.addEventListener('DOMContentLoaded', ()=> {
    document.addEventListener('click', (e)=> {
        e.stopPropagation();
        const postId = e.target.getAttribute('data-like')
        const likersDialog = document.getElementById(`likers-dialog-${postId}`)
        if(e.target.classList.contains(`likeCount`)) {  
            likersDialog.classList.remove('hidden')
        } else {
            const openDialogs = document.querySelectorAll('.likers-dialog:not(.hidden)');
            openDialogs.forEach(dialog => {
                if (!dialog.contains(e.target)) {
                    dialog.classList.add('hidden');
                }
            });
        }
    })
})





document.addEventListener('DOMContentLoaded', () => {
    // toggle comments visibility
    document.addEventListener('click', (e) => {
if (e.target.classList.contains('icon-comments')) {
    e.stopPropagation();
    const postId = e.target.getAttribute('data-id');
    const commentsContainer = document.getElementById(`comments-${postId}`);
    commentsContainer.classList.toggle('hidden');

    // if user click outside the comments it will close the comment section
    document.addEventListener('click', (e) => {

// checking if the users click the comment-section <div></div>
if (!e.target.closest('.comments-section') && !e.target.closest('.add-comment')) {
    document.querySelectorAll('.comments-container').forEach(commentsContainer => {
        if (!commentsContainer.classList.contains('hidden')) {
            commentsContainer.classList.add('hidden');
        }
    });
}
});
}

});
})
   

    // add a new comment
    document.addEventListener('DOMContentLoaded', ()=> {
        document.addEventListener('click', async(e)=> {
            if(e.target.classList.contains('add-comment-btn')) {
                const postId = e.target.getAttribute('data-id');
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
                                                    <div class="name-section">
                                                                <img id="newsfeed-profile-comment" src="${newComment.user.profile_pictures || './uploads/default-profile.png'}">
                                                                <a href="/user/${newComment.user_id}" class="profile_link author"><small>${newComment.user.firstname} ${newComment.user.lastname}:</small></a>
                                                            </div>
                                                    <p class="content">${newComment.content}</p>
                                                    <p class="publishDate">
                                                        <small>${new Date(newComment.created_at).toLocaleString()}</small>
                                                    </p>
                                                     <div id="replies-${newComment.id}" class="replies-container hidden">
                                                    <div id="showmore-${newComment.id}>">
                                                            <button class='show-more-replies hidden button${newComment.id}' data-comment-id="${newComment.id}">Show More Replies</button>
                                                    </div>
                                                </div>
                                                
                                                              <div class="reply-input${newComment.id} replycontainer hidden" id="reply-input-${newComment.id}">
                                                                    <input type="text" class="reply-comment-input" placeholder="Write a reply...">
    
                                                                    <button class="submit-reply-btn" data-comment-id="${newComment.id}">Send</button>
                                                                </div>`
                                                
    
                        if(noComments){
                            noComments.style.display = 'none';
                        }
                        
                        commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
                        commentInput.value = ''; // Clear input
                        if (commentsContainer.classList.contains('hidden')) {
                            commentsContainer.classList.remove('hidden');
    
                        }
    
                        //update the toggle button
    
                        }
                    
                } catch (error) {
                    console.error('Error adding comment:', error);
            alert('Error adding comment');
                }
            }
            
        })
    })

    //     document.querySelectorAll('.add-comment-btn').forEach(button => {
    //         button.addEventListener('click', async () => {
    //             const postId = button.getAttribute('data-id');
    //             const commentInput = document.getElementById(`comment-input-${postId}`);
    //             const commentContent = commentInput.value.trim(); //trim() method will remove white spaces of the text
                
    //             if (!commentContent) {
    //                 alert('Comment cannot be empty!');
    //                 return;
    //             }
    //             try {
    //                  const response = await fetch(`/api/posts/${postId}/comments`, {
    //                     method: 'POST',
    //                     headers: { 'Content-Type': 'application/json' },
    //                     body: JSON.stringify({ content: commentContent }),
    //                 });
    //                 if (response.ok) {
    //                     const noComments = document.querySelector('.no-comments');
    //                     const newComment = await response.json();
    //                     const commentsContainer = document.getElementById(`comments-${postId}`);
    //                     const commentHTML = `
    //                     <div class="comment">
    //                                                 <p>
    //                                                     <a href="/user/${newComment.user_id}" class="profile_link author"><small>${newComment.user.firstname} ${newComment.user.lastname}:</small></a>
    //                                                 </p>
    //                                                 <p class="content">${newComment.content}</p>
    //                                                 <p class="publishDate">
    //                                                     <small>${new Date(newComment.created_at).toLocaleString()}</small>
    //                                                 </p>
    //                                             </div>
    //                                             <div class="hide_comments">
    //                                                             <button id="button-<%= comment.id %>" class="reply-btn" data-comment-id="${newComment.user_id}" data-user="${newComment.user.firstname} ${newComment.user.lastname}">show replies</button>
    //                                                             <div class="icons-box">
    //                                                                 <svg class="svg-comments" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#629584" viewBox="0 0 16 16">
    //                                                                     <path fill="#629584" d="M12.344 11.458A5.28 5.28 0 0 0 14 7.526C14 4.483 11.391 2 8.051 2S2 4.483 2 7.527c0 3.051 2.712 5.526 6.059 5.526a6.6 6.6 0 0 0 1.758-.236q.255.223.554.414c.784.51 1.626.768 2.512.768a.37.37 0 0 0 .355-.214.37.37 0 0 0-.03-.384 4.7 4.7 0 0 1-.857-1.958v.014z">
    //                                                                     </path>
    //                                                                 </svg>
                                                                    
    //                                                                 <span class="comment_count"> ${newComment.totalReplies}</span>
    //                                                             </div>
                                                                
    //                                                           </div>
    //                                                           <div class="reply-input${newComment.id} replycontainer hidden" id="reply-input-${newComment.id}">
    //                                                                 <input type="text" class="reply-comment-input" placeholder="Write a reply...">
    
    //                                                                 <button class="submit-reply-btn" data-comment-id="${newComment.id}">Send</button>
    //                                                             </div>`
                                                
    
    //                     if(noComments){
    //                         noComments.style.display = 'none';
    //                     }
                        
    //                     commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
    //                     commentInput.value = ''; // Clear input
    //                     if (commentsContainer.classList.contains('hidden')) {
    //                         commentsContainer.classList.remove('hidden');
    
    //                     }
    
    //                     //update the toggle button
    
    //                     }
    //             } catch (error) {
    //     console.error('Error adding comment:', error);
    //     alert('Error adding comment');
    //   }
    // });
    // });
    // });

    // })
    

//show replies
document.addEventListener('DOMContentLoaded', () => {
    // handle reply button click events
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('reply-btn')) {
            const commentId = e.target.getAttribute('data-comment-id'); // get the ID of the comment
            const replyInput = document.querySelector(`.reply-input${commentId}`); // select the reply input for the comment
            const repliesContainer = document.getElementById(`replies-${commentId}`); // get the container for replies
            const showMoreContainer = document.getElementById(`showmore-${commentId}`);
            const showMoreButton = showMoreContainer.querySelector('.show-more-replies');
            e.stopPropagation();

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

                               <div class="name-section">
                               <img id="newsfeed-profile-comment" src="${reply.profile_pictures || './uploads/default-profile.png'}">
                               <p>
                               <a href="/user/${reply.user_id}" class="profile_link author">
                               <small><span>${reply.firstname} ${reply.lastname}:</small></span></a>
                               </p>
                               </div>
                               
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

                    if (!repliesContainer) {
                        console.error(`Replies container not found for comment ID ${commentId}`);
                        return;
                    }
                    const replyHTML = `
                        <div class="reply">

                            <div class="name-section">
                            <img id="newsfeed-profile-comment" src="${data.userData.profile_pictures || './uploads/default-profile.png'}">
                            <a href="/user/${data.userData.id}" class="profile_link author reply_author">
                                    <small>${data.userData.firstname} ${data.userData.lastname}:</small>
                                </a>
                            </div>

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
                    if(hideButton){
                        hideButton.textContent = 'hide replies'
                    }
                    
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
                    console.error('Error fetching post content:', error);
                }
            } else if (e.target.classList.contains('read-less')) {
            e.preventDefault();

            const postId = e.target.getAttribute('data-id');
            const postElements = document.getElementById(`content-id${postId}`);

            // shortened the  text to first 200 characters
            const fullContent = postElements.textContent;
            const shortenedText = `${fullContent.substring(0, 200)}...`; //cut the post into first 200 characters
            postElements.textContent = shortenedText;
            postElements.style.whiteSpace = 'normal';

            // change button back to "Read More"
            e.target.textContent = "Read More";
            e.target.classList.remove('read-less');
            e.target.classList.add('read-more');
        }

        })
    });
})

document.addEventListener('click', async (e) => { //handling the like button 
    // console.log(e.target);
    if (e.target.classList.contains('like-btn')) { 
        console.log('click')
        e.stopPropagation();
      const button = e.target;
      const postId = button.getAttribute('data-post-id');
      const userId = button.getAttribute('data-user-id');
      console.log(userId)
  
      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
  
        if (response.ok) {
          const data = await response.json();
          const likeCountElement = document.querySelector(`.like-id-${postId}`); //get the likecount html element

  
          if (data.liked) { //if users already liked the post then change the color of the button to red
            button.style.fill = 'rgb(227, 45, 45)'; //change color to red if users clicks like button
            if(likeCountElement){ //if exist then change the like count depend on the liek counts from the database
                likeCountElement.textContent = data.like_count == 1 ? `You` : `You + ${data.like_count - 1} likes`;
              }
            
          } else {
            //remove color of the button if users unlike
            button.style.fill = '#E2F1E7';
            likeCountElement.textContent = `${data.like_count} likes`;
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

  document.addEventListener('DOMContentLoaded', () => { //handling the follow/ unfollow button
    document.addEventListener('click', async(e)=> {
        if(e.target.classList.contains('follow-btn')) {
            e.preventDefault();
            const button = e.target
            const userId = button.getAttribute('data-user-id');

            try {
                const response = await fetch(`/api/users/${userId}/follow`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if(response.ok) {
                    const data = await response.json();
                    button.textContent = data.following ? 'Unfollow' : 'Follow';

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

  //handling the preview of the photo when users want to upload a photo in their post
  document.addEventListener('DOMContentLoaded', ()=>{
    
        const fileInput = document.getElementById('upload_photo')

            if(fileInput) {
                fileInput.addEventListener('change', (e)=>{ //detects if the users chosen a file
                    const fileInput = e.target;
                    if(!fileInput.files || fileInput.files.length === 0){
                        console.warn("No file selected."); // debugging log
                        return;
                    }
            
                    const file = e.target.files[0];
                    if(file){
                        const reader = new FileReader();
                        reader.onload = (e) =>{ // handle the result when reading is complete
                            const previewContainer = document.getElementById('previewContainer');
                            const imagePreview = document.getElementById('imagePreview');
            
                            imagePreview.src = e.target.result; //setting the preview image src into the chosen file of users
                            previewContainer.style.display = 'block' //show the preview container by changing the display from none to flex
                        }
                        reader.readAsDataURL(file); //reading the file when onload events completes 
                    }
                })
            }  else {
                console.warn("File input element not found.");
            }
        
  })
  






