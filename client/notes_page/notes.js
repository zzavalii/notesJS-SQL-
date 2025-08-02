document.addEventListener("DOMContentLoaded", async() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn !== "true") {
        window.location.href = "/sign-in.html";
    }
    const addNoteBtnNotS = document.getElementById('add_note_notstarted');
    const addNoteBtnInProgrs = document.getElementById('add_note_inprogress');
    const addNoteBtnDone = document.getElementById('add_note_done');
    const noteContainer_NotS = addNoteBtnNotS.parentElement;
    const noteContainer_Progress = addNoteBtnInProgrs.parentElement;
    const noteContainer_Done = addNoteBtnDone.parentElement;
    
    const token = localStorage.getItem("token");
    
    try {
        const outputEmail = document.querySelector(".userEmail");
        const responseInfo = await fetch(`http://localhost:3000/notes/userinfo`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });

        const dataOut = await responseInfo.json();
        outputEmail.textContent = ("Email:" + " " + dataOut.email);


        const response = await fetch("http://localhost:3000/usernotes", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("isLoggedIn");
            window.location.href = "/sign-in.html";
            return;
        }

        const data = await response.json();

        data.notes.forEach(note => {
            const noteDiv = document.createElement("div");
            noteDiv.classList.add("note");
            noteDiv.dataset.id = note.id;
            
            const titleEl = document.createElement("h3");
            titleEl.textContent = note.title;

            const btnDelete = document.createElement("button");
            btnDelete.id = 'btnDelete';
            btnDelete.textContent = 'x';

            btnDelete.addEventListener("click", async() => {
                try {
                    const response = await fetch(`http://localhost:3000/notes/delete/${note.id}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ })
                    })

                    if (response.ok) {
                        ['not_started', 'in_progress', 'done'].forEach(fetchNoteCount);
                        noteDiv.remove();
                    } else {
                        console.error('Ошибка при удалении');
                    }
                } catch (err) {
                    console.error(err);
                }
            })

            const contentEl = document.createElement("p");
            contentEl.textContent = note.content;
            
            noteDiv.appendChild(titleEl);
            noteDiv.appendChild(btnDelete);
            noteDiv.appendChild(contentEl);

            if(note.status === 'not_started'){
                noteContainer_NotS.insertBefore(noteDiv, addNoteBtnNotS);
            }
            if(note.status === 'in_progress'){
                noteContainer_Progress.insertBefore(noteDiv, addNoteBtnInProgrs);  
            }
            if(note.status === 'done'){
                noteContainer_Done.insertBefore(noteDiv, addNoteBtnDone);
            }
        });
    } catch (err) {
        console.error(err);
    }

    console.log("Token:", token); 

    document.querySelectorAll(".note").forEach(note => {
        note.addEventListener("click", async (event) => {

            if(event.target.closest("#btnDelete")) return;

            const openedNote = document.createElement('div');
            openedNote.classList.add('opened_note');
            openedNote.dataset.id = note.dataset.id;
            

            const blurOverlay = document.createElement('div');
            blurOverlay.classList.add('blur-overlay');

            const allContainerItems = document.createElement("div");
            allContainerItems.classList.add("allContainerItems");

            const todo = document.createElement("h2");
            todo.classList.add("ToDoList");
            todo.textContent = 'To Do List';

            const addNotesItemBtn = document.createElement("button");
            addNotesItemBtn.classList.add("addNotesItemBtn");
            addNotesItemBtn.textContent = '+ item';

            document.body.appendChild(blurOverlay);
            document.body.appendChild(openedNote);
            allContainerItems.appendChild(todo);
            allContainerItems.appendChild(addNotesItemBtn);
            openedNote.appendChild(allContainerItems);

            if(openedNote){
                const noteId = openedNote.dataset.id;
                if (!noteId) {
                    console.error("❌ noteId is undefined!");
                    return;
                }
                const responseItems = await fetch(`http://localhost:3000/usernoteitems?note_id=${noteId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                if (responseItems.status === 401 || responseItems.status === 403) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("isLoggedIn");
                    window.location.href = "/sign-in.html";
                    return;
                }

                const dataNoteItems = await responseItems.json();

                dataNoteItems.noteItems.forEach(noteItem => {
                    const itemBlock = createModalNoteItem(noteItem);
                    openedNote.appendChild(itemBlock);
                });
            }

            addNotesItemBtn.addEventListener("click", () => {
                const itemBlock = document.createElement("div");
                itemBlock.classList.add("itemBlock");
                itemBlock.dataset.id = note.dataset.id;

                const textItem = document.createElement("input");
                textItem.type = "text";
                textItem.placeholder = "Введите заметку...";
                textItem.id = "textItem";

                itemBlock.appendChild(textItem);
                openedNote.appendChild(itemBlock);

                function handleOutsideClick(event) {
                    if (!itemBlock.contains(event.target)) {
                        const content = textItem.value.trim();
                        if (!content) {
                            itemBlock.remove();
                            document.removeEventListener('click', handleOutsideClick);
                            return;
                        }

                        fetch("http://localhost:3000/newitems", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                note_id: openedNote.dataset.id,
                                content: content,
                                is_done: false
                            })
                        })
                        .then(async (response) => {
                            if (response.status === 401 || response.status === 403) {
                                localStorage.removeItem("token");
                                localStorage.removeItem("isLoggedIn");
                                window.location.href = "/sign-in.html";
                                return;
                            }

                            if (!response.ok) throw new Error("Ошибка сервера");

                            const data = await response.json();
                            console.log("✅ Добавлено:", data);

                            itemBlock.remove(); 

                            const newCard = createModalNoteItem(data.noteItem); 
                            openedNote.appendChild(newCard);
                        })
                        .catch((err) => {
                            console.error(err);
                            alert("❌ Не удалось сохранить заметку");
                        })
                        .finally(() => {
                            document.removeEventListener('click', handleOutsideClick);
                        });
                    }
                }

                setTimeout(() => {
                    document.addEventListener('click', handleOutsideClick);
                }, 0);
            });
    
            function closeModal() {
                openedNote.remove();
                blurOverlay.remove();
            }

            blurOverlay.addEventListener("click", closeModal);
        })
    })
    
    // ========= Не начатые заметки =======
    addNoteBtnNotS.addEventListener('click', () => {
        addNoteBtnNotS.style.display = 'none';
        const status = 'not_started';

        const noteWrapper = document.createElement('div');
        noteWrapper.className = 'note_wrapper_notStarted';

        const inputsContainer = document.createElement('div');
        inputsContainer.id = 'inputsContainer_notStarted';

        const textTitle = document.createElement('input');
        textTitle.type = 'text';
        textTitle.placeholder = 'Введите заголовок...';
        textTitle.id = 'new_note_inputTitle';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Введите заметку...';
        input.id = 'new_note_input';

        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveBtn_notStarted';
        saveBtn.textContent = 'Сохранить';

        inputsContainer.appendChild(textTitle);
        inputsContainer.appendChild(input);

        noteWrapper.appendChild(inputsContainer);
        noteWrapper.appendChild(saveBtn);

        noteContainer_NotS.insertBefore(noteWrapper, addNoteBtnNotS);

        input.focus();

        function handleOutsideClick(event) {
            if (!noteWrapper.contains(event.target)) {
                const title = textTitle.value.trim();
                const content = input.value.trim();

                if (!title || !content) {
                    noteWrapper.remove();
                    addNoteBtnNotS.style.display = 'block';
                    document.removeEventListener('click', handleOutsideClick);
                    return;
                }

                fetch("http://localhost:3000/newnote", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, content, status })
                })
                .then(async (response) => {
                    if (!response.ok) throw new Error("Ошибка сервера");
                    const data = await response.json();
                    console.log("✅ Добавлено:", data);

                    const newCard = createNoteCard(data.note);
                    // noteContainer_NotS.insertBefore(newCard, addNoteBtnNotS);
                    makeNoteDraggable(newCard);
                })
                .catch((err) => {
                    console.error(err);
                    alert("❌ Не удалось сохранить заметку");
                })
                .finally(() => {
                    noteWrapper.remove();
                    addNoteBtnNotS.style.display = 'block';
                    document.removeEventListener('click', handleOutsideClick);
                });
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);

        saveBtn.addEventListener('click', async () => {
            const title = textTitle.value.trim();
            const content = input.value.trim();

            if (!title || !content) {
                return alert('Введите заголовок и заметку');
            }

            try {
                const response = await fetch("http://localhost:3000/newnote", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, content, status })
                });

                if (response.ok) {
                    const newNote = await response.json();
                    const newCard = createNoteCard(newNote.note);
                    noteContainer_NotS.insertBefore(newCard, addNoteBtnNotS);
                    noteWrapper.remove();
                    addNoteBtnNotS.style.display = 'block';
                } else {
                    alert('Ошибка при сохранении');
                }

            } catch (err) {
                console.error(err);
            }
        });
    });

    // ========== Заметки в прогрессе ========= //

    addNoteBtnInProgrs.addEventListener('click', () => {
        addNoteBtnInProgrs.style.display = 'none';
        const status = 'in_progress';

        const noteWrapperProgress = document.createElement('div');
        noteWrapperProgress.className = 'note_wrapper_InProgress';

        const inputsContainerInProgg = document.createElement('div');
        inputsContainerInProgg.id = 'inputsContainer_InProgress';

        const textTitle = document.createElement('input');
        textTitle.type = 'text';
        textTitle.placeholder = 'Введите заголовок...';
        textTitle.id = 'new_note_inputTitle';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Введите заметку...';
        input.id = 'new_note_input';

        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveBtn_inProgress';
        saveBtn.textContent = 'Сохранить';

        inputsContainerInProgg.appendChild(textTitle);
        inputsContainerInProgg.appendChild(input);

        noteWrapperProgress.appendChild(inputsContainerInProgg);
        noteWrapperProgress.appendChild(saveBtn);

        noteContainer_Progress.insertBefore(noteWrapperProgress, addNoteBtnInProgrs);

        input.focus();

        function handleOutsideClick(event) {
            if (!noteWrapperProgress.contains(event.target)) {
                noteWrapperProgress.remove();
                addNoteBtnInProgrs.style.display = 'block';
                document.removeEventListener('click', handleOutsideClick);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);

        saveBtn.addEventListener('click', async () => {
            const title = textTitle.value.trim();
            const content = input.value.trim();

            if (!title || !content) {
                return alert('Введите заголовок и заметку');
            }

            try {
                const response = await fetch("http://localhost:3000/newnote", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, content, status })
                });

                if (response.ok) {
                    const newNote = await response.json();
                    const newCard = createNoteCard(newNote.note);
                    noteContainer_Progress.insertBefore(newCard, addNoteBtnInProgrs);
                    noteWrapperProgress.remove();
                    addNoteBtnInProgrs.style.display = 'block';
                } else {
                    alert('Ошибка при сохранении');
                }

            } catch (err) {
                console.error(err);
            }
        });
    });

    //============ Выполненные заметки =========== // 
    addNoteBtnDone.addEventListener('click', () => {
        addNoteBtnDone.style.display = 'none';
        const statusDone = 'done';

        const noteWrapper = document.createElement('div');
        noteWrapper.className = 'note_wrapper_Done';

        const inputsContainer = document.createElement('div');
        inputsContainer.id = 'inputsContainer_Done';

        const textTitle = document.createElement('input');
        textTitle.type = 'text';
        textTitle.placeholder = 'Введите заголовок...';
        textTitle.id = 'new_note_inputTitle';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Введите заметку...';
        input.id = 'new_note_input';

        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveBtn_Done';
        saveBtn.textContent = 'Сохранить';

        inputsContainer.appendChild(textTitle);
        inputsContainer.appendChild(input);

        noteWrapper.appendChild(inputsContainer);
        noteWrapper.appendChild(saveBtn);

        noteContainer_Done.insertBefore(noteWrapper, addNoteBtnDone);

        input.focus();

        function handleOutsideClick(event) {
            if (!noteWrapper.contains(event.target)) {
                noteWrapper.remove();
                addNoteBtnDone.style.display = 'block';
                document.removeEventListener('click', handleOutsideClick);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);

        saveBtn.addEventListener('click', async () => {
            const title = textTitle.value.trim();
            const content = input.value.trim();
            const status = statusDone;
            if (!title || !content) {
                return alert('Введите заголовок и заметку');
            }

            try {
                const response = await fetch("http://localhost:3000/newnote", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, content, status })
                });

                if (response.ok) {
                    const newNote = await response.json();
                    const newCard = createNoteCard(newNote.note);
                    noteContainer_Done.insertBefore(newCard, addNoteBtnDone);
                    noteWrapper.remove();
                    addNoteBtnDone.style.display = 'block';
                } else {
                    alert('Ошибка при сохранении');
                }

            } catch (err) {
                console.error(err);
            }
        });
    });

    // ===== Drag&Drop ========= //

    let draggedNote = null;
    let blueLine = document.createElement('div');
    blueLine.id = 'blueLine';

    function makeNoteDraggable(note) {
        note.draggable = true;

        note.addEventListener('dragstart', (e) => {
            draggedNote = note;
            note.classList.add('dragging');
            e.dataTransfer.setData('text/plain', note.dataset.id);
        });

        note.addEventListener('dragend', () => {
            draggedNote = null;
            if (blueLine && blueLine.parentNode) {
                blueLine.parentNode.removeChild(blueLine);
            }
            ['not_started', 'in_progress', 'done'].forEach(fetchNoteCount);
            note.classList.remove('dragging');
        });
    }

    document.querySelectorAll('.note').forEach(makeNoteDraggable);
    
    document.querySelectorAll('.note_column').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();

            const afterElement = getDragAfterElement(column, e.clientY)

            if (blueLine.parentNode) {
                blueLine.parentNode.removeChild(blueLine);
            }

            if (afterElement == null){
                column.insertBefore(blueLine, column.querySelector('.add_button'))
            } else {
                column.insertBefore(blueLine, afterElement)
            }

        });
            
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            const noteId = e.dataTransfer.getData('text/plain');

            const noteElement = document.querySelector(`[data-id="${noteId}"]`);
            if (!noteElement) return;
            
            if (blueLine && blueLine.parentNode) {
                blueLine.parentNode.insertBefore(noteElement, blueLine);
                blueLine.remove();
            } else {
                column.insertBefore(noteElement, column.querySelector('.add_button'));
            }
            const newStatus = column.id;

            try {
                await fetch(`http://localhost:3000/notes/${noteId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });
            } catch (err) {
                console.error("Ошибка при обновлении статуса:", err);
            }
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.note:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // ===== Drag&Drop ========= //

    function createNoteCard(note) {
        const noteDiv = document.createElement("div");
        noteDiv.classList.add("note");
        noteDiv.dataset.id = note.id;

        document.querySelector(`.groundTitle_${statusToClass(note.status)}`).appendChild(noteDiv);

        makeNoteDraggable(noteDiv);

        noteDiv.addEventListener("click", async (event) => {
            if (event.target.closest("#btnDelete")) return;

            const openedNote = document.createElement('div');
            openedNote.classList.add('opened_note');

            const blurOverlay = document.createElement('div');
            blurOverlay.classList.add('blur-overlay');

            document.body.appendChild(blurOverlay);
            document.body.appendChild(openedNote);

            function closeModal() {
                openedNote.remove();
                blurOverlay.remove();
            }

            blurOverlay.addEventListener("click", closeModal);

            const allContainerItems = document.createElement("div");
            allContainerItems.classList.add("allContainerItems");

            const todo = document.createElement("h2");
            todo.classList.add("ToDoList");
            todo.textContent = 'To Do List';

            const addNotesItemBtn = document.createElement("button");
            addNotesItemBtn.classList.add("addNotesItemBtn");
            addNotesItemBtn.textContent = '+ item';

            const itemsContainer = document.createElement("div");
            itemsContainer.classList.add("itemsContainer");

            allContainerItems.appendChild(todo);
            allContainerItems.appendChild(addNotesItemBtn);
            allContainerItems.appendChild(itemsContainer);

            openedNote.appendChild(allContainerItems);

            addNotesItemBtn.addEventListener("click", () => {
                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = "Введіть новий пункт";
                input.classList.add("modal-input");

                itemsContainer.appendChild(input);
                input.focus();

                input.addEventListener("blur", async () => {
                    const content = input.value.trim();
                    input.remove();

                    if (content !== "") {
                        try {
                            const res = await fetch(`http://localhost:3000/newitems`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    content,
                                    is_done: false,
                                    note_id: note.id
                                })
                            });

                            if (!res.ok) throw new Error("Не вдалося створити пункт");

                            const data = await res.json();
                            const newItem = data.noteItem;

                            const itemBlock = createModalNoteItem(newItem);
                            itemsContainer.appendChild(itemBlock);

                        } catch (err) {
                            console.error(err);
                            alert("❌ Сталася помилка при збереженні пункту");
                        }
                    }
                });
    });

            try {
                const res = await fetch(`http://localhost:3000/usernoteitems?note_id=${note.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("Ошибка при загрузке элементов");

                const data = await res.json();
                const noteItems = data.noteItems;

                noteItems.forEach(item => {
                    const itemBlock = createModalNoteItem(item);
                    itemsContainer.appendChild(itemBlock);
                });

            } catch (err) {
                console.error(err);
                const errorMessage = document.createElement("p");
                errorMessage.textContent = "❌ Не удалось загрузить элементы";
                errorMessage.style.color = "red";
                openedNote.appendChild(errorMessage);
            }
        });

        const titleEl = document.createElement("h3");
        titleEl.textContent = note.title;

        const btnDelete = document.createElement("button");
        btnDelete.id = 'btnDelete';
        btnDelete.textContent = 'x';

        btnDelete.addEventListener("click", async () => {
            try {
                const response = await fetch(`http://localhost:3000/notes/delete/${note.id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({})
                });
                ['not_started', 'in_progress', 'done'].forEach(fetchNoteCount);
                if (response.ok) {
                    noteDiv.remove();
                } else {
                    console.error('Ошибка при удалении');
                }
            } catch (err) {
                console.error(err);
            }
        });

        const contentEl = document.createElement("p");
        contentEl.textContent = note.content;

        noteDiv.appendChild(titleEl);
        noteDiv.appendChild(btnDelete);
        noteDiv.appendChild(contentEl);

        ['not_started', 'in_progress', 'done'].forEach(fetchNoteCount);

        return noteDiv;
    }

    function createModalNoteItem(noteItem) {
        const containerBlockItems = document.createElement("div");
        containerBlockItems.classList.add("containerBlockItems")

        const itemBlock = document.createElement("div");
        itemBlock.classList.add("itemBlock");
        itemBlock.dataset.id = noteItem.item_id;

        const checkItem = document.createElement("input");
        checkItem.type = "checkbox";
        checkItem.classList.add("checkItem");
        checkItem.checked = noteItem.is_done;

        checkItem.dataset.itemId = noteItem.item_id

        checkItem.addEventListener("click", async(event) => {
            const itemId = event.target.dataset.itemId;
            const newStatus = event.target.checked;

            try {
                const response = await fetch(`http://localhost:3000/noteitems/${itemId}/status`, {
                method:"PUT", 
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({is_done: newStatus})
            })
            } catch(err){
                console.error(err);
            }
        })

        const textItem = document.createElement("span");
        textItem.classList.add("textItem");
        textItem.textContent = noteItem.content;

        itemBlock.appendChild(checkItem);
        itemBlock.appendChild(textItem);

        containerBlockItems.appendChild(itemBlock);

        return containerBlockItems;
    }

    async function fetchNoteCount(status) {
        try {
            const response = await fetch(`http://localhost:3000/getcount?status=${status}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();

            const titleEl = document.querySelector(`.groundTitle_${statusToClass(status)}`);
            if (titleEl) {
                titleEl.innerHTML = `<p>○ ${toLabel(status)} (${data.count})</p>`;
            }
        } catch (err) {
            console.error("❌ Error:", err);
        }
    }

    function statusToClass(status) {
        return {
            not_started: 'notStarted',
            in_progress: 'inProgress',
            done: 'Done'
        }[status];
    }

    function toLabel(status) {
        return {
            not_started: 'Not Started',
            in_progress: 'In Progress',
            done: 'Done'
        }[status];
    }

    ['not_started', 'in_progress', 'done'].forEach(fetchNoteCount);

    document.getElementById("logout").addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/sign-in.html";
    });

    document.getElementById("profile").addEventListener("click", function () {
        const profileHeader = document.querySelector(".profile_header");

        profileHeader.style.display = 'block';

        function handleOutsideClick(event) {
            if (!profileHeader.contains(event.target) && event.target.id !== "profile") {
                profileHeader.style.display = 'none';
                document.removeEventListener('click', handleOutsideClick);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);
    });

    const darkText = document.querySelector(".darktheme");
    const dropDownItem = document.querySelector(".dropdown-toggle");
    darkText.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        darkText.classList.toggle("darkText");
        dropDownItem.classList.toggle("dropdown-toggleDarkTheme");
    });

});

