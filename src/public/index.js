

function setName() {
      const name = document.getElementById('username').value.trim();
      const welcomeNote = document.getElementById('welcome-note');
      if (name) {
        welcomeNote.textContent = `Welcome, ${name}! Instantly find nearby healthcare services, check medication information, and get first-aid tips tailored for Rwanda.`;
        document.getElementById('name-section').style.display = 'none';
      } else {
        welcomeNote.textContent = 'Welcome to IremboCare+! Instantly find nearby healthcare services, check medication information, and get first-aid tips tailored for Rwanda.';
      }
    }

