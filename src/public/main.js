// 🏥 Enhanced Health Services Search with Animations
async function findServices() {
  const location = document.getElementById('location').value;
  const ul = document.getElementById('services');
  const button = event.target;
  
  // Validation with friendly message
  if (!location) {
    showMessage(ul, '📍 Please select your district first!', 'info');
    shakeElement(document.getElementById('location'));
    return;
  }
  
  // Show loading state
  button.disabled = true;
  button.innerHTML = '🔍 Searching...';
  showLoadingMessage(ul, 'Finding healthcare services in ' + location + '...');
  
  try {
    const res = await fetch(`/api/health-services?location=${encodeURIComponent(location)}`);
    const data = await res.json();
    
    if (res.ok && data.success) {
      ul.innerHTML = '';
      if (data.data && data.data.length > 0) {
        showMessage(ul, `🎉 Found ${data.data.length} healthcare services in ${location}!`, 'success');
        
        data.data.forEach((item, index) => {
          setTimeout(() => {
            const li = document.createElement('li');
            li.innerHTML = `
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">🏥</span>
                <div>
                  <strong>${item.display_name}</strong><br>
                  <small style="color: #666;">ID: ${item.id}</small>
                </div>
              </div>
            `;
            li.style.opacity = '0';
            li.style.transform = 'translateY(20px)';
            ul.appendChild(li);
            
            // Animate in
            setTimeout(() => {
              li.style.transition = 'all 0.3s ease';
              li.style.opacity = '1';
              li.style.transform = 'translateY(0)';
            }, 50);
          }, index * 150);
        });
      } else {
        showMessage(ul, '😔 No healthcare services found in ' + location + '. Try another district!', 'info');
      }
    } else {
      showMessage(ul, '❌ ' + (data.message || data.error || 'Error fetching services'), 'error');
    }
  } catch (e) {
    showMessage(ul, '🚨 Network error. Please check your connection!', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = '🔍 Search';
  }
}

// 💊 Enhanced Medication Search with Better UI
async function findMedication() {
  const disease = document.getElementById('disease').value.trim();
  const ul = document.getElementById('medications');
  const button = event.target;

  // Validation
  if (!disease) {
    showMessage(ul, '💊 Please enter a disease name first!', 'info');
    shakeElement(document.getElementById('disease'));
    return;
  }

  // Loading state
  button.disabled = true;
  button.innerHTML = '🔍 Searching...';
  showLoadingMessage(ul, 'Looking up medications for ' + disease + '...');

  try {
    const res = await fetch(`/api/medication?disease=${encodeURIComponent(disease)}`);
    const data = await res.json();
    
    if (res.ok && data.success) {
      ul.innerHTML = '';
      if (data.data && data.data.length > 0) {
        showMessage(ul, `💊 Found ${data.data.length} medications for ${disease}`, 'success');
        
        data.data.forEach((item, index) => {
          setTimeout(() => {
            const li = document.createElement('li');
            const brandName = item.openfda && item.openfda.brand_name ? item.openfda.brand_name.join(', ') : 'Unknown Medication';
            const genericName = item.openfda && item.openfda.generic_name ? item.openfda.generic_name.join(', ') : '';
            const dosage = item.dosage || 'Consult healthcare provider';
            
            li.innerHTML = `
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">💊</span>
                <div>
                  <strong style="color: #667eea;">${brandName}</strong><br>
                  ${genericName ? `<small>Generic: ${genericName}</small><br>` : ''}
                  <small style="color: #10b981;">💡 ${dosage}</small>
                </div>
              </div>
            `;
            
            li.style.opacity = '0';
            li.style.transform = 'translateX(-20px)';
            ul.appendChild(li);
            
            setTimeout(() => {
              li.style.transition = 'all 0.3s ease';
              li.style.opacity = '1';
              li.style.transform = 'translateX(0)';
            }, 50);
          }, index * 120);
        });
      } else {
        showMessage(ul, '😞 No medications found for ' + disease + '. Try a different condition!', 'info');
      }
    } else {
      showMessage(ul, '❌ ' + (data.error || 'Error fetching medication info'), 'error');
    }
  } catch (e) {
    showMessage(ul, '🚨 Network error. Please try again!', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = '🔍 Search';
  }
}

// 🆘 Get First-Aid Tips with Interactive Animation
async function getTips() {
  const ul = document.getElementById('tips');
  const button = event.target;
  ul.innerHTML = '';
  ul.style.position = 'relative';
  showLoadingMessage(ul, '🩹 Fetching first-aid tips...');
  button.disabled = true;
  button.innerHTML = '🔄 Loading...';

  try {
    const res = await fetch('/api/first-aid');
    const data = await res.json();
    
    ul.innerHTML = '';
    showMessage(ul, `✅ Loaded ${data.length} first-aid tips!`, 'success');

    data.forEach((item, index) =e {
      setTimeout(() =e {
        const li = document.createElement('li');
        li.innerHTML = `
          div style="display: flex; align-items: center; gap: 10px;"
            span style="font-size: 1.5rem;"🩺/span
            div
              strong style="color: #e53e3e;"${item.condition}/strong
              br
              small${item.tip}/small
            /div
          /div
        `;
        li.style.opacity = '0';
        li.style.transform = 'translateY(20px)';
        ul.appendChild(li);
        
        setTimeout(() =e {
          li.style.transition = 'all 0.3s ease';
          li.style.opacity = '1';
          li.style.transform = 'translateY(0)';
        }, 50);
      }, index * 150);
    });
  } catch (e) {
    showMessage(ul, '⚠️ Error fetching tips. Please try again later.', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = '🆘 Show Tips';
  }
}

async function askAIDoctor() {
  const message = document.getElementById('ai-message').value;
  const specialization = document.getElementById('ai-specialization').value;
  const responseDiv = document.getElementById('ai-response');
  responseDiv.textContent = 'Loading...';
  try {
    const res = await fetch('/api/ai-doctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, specialization, language: 'en' })
    });
    const data = await res.json();
    if (res.ok) {
      responseDiv.textContent = data.answer || JSON.stringify(data);
    } else {
      responseDiv.textContent = data.error || 'Error fetching AI doctor response.';
    }
  } catch (e) {
    responseDiv.textContent = 'Error fetching AI doctor response.';
  }
}