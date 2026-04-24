// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://acxfqpnpqibwygkobbzb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjeGZxcG5wcWlid3lna29iYnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTYyNjgsImV4cCI6MjA4MTMzMjI2OH0.0pvVQFw3UWUIbOppFQjFI_lhbveOPxRGjFYS_vWDb2Y';
const TABLE_NAME = 'participants';

// Inicializar o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos DOM
const registrationForm = document.getElementById('registrationForm');
const participantsContainer = document.getElementById('participantsContainer');
const notification = document.getElementById('notification');
const errorNotification = document.getElementById('errorNotification');
const totalParticipantsElement = document.getElementById('totalParticipants');
const alreadyRegisteredDiv = document.getElementById('alreadyRegistered');
const successMessageDiv = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');
const debugInfo = document.getElementById('debugInfo');

// Mostrar informações de debug
function showDebugInfo(message) {
    debugInfo.innerHTML = message;
    debugInfo.style.display = 'block';
}

// Verificar se o usuário já está registrado ao carregar a página
function checkIfAlreadyRegistered() {
    const savedPhone = localStorage.getItem('registeredPhone');
    if (savedPhone) {
        isPhoneRegistered(savedPhone).then(alreadyRegistered => {
            if (alreadyRegistered) {
                showAlreadyRegistered();
            }
        });
    }
}

// Mostrar mensagem de já registrado
function showAlreadyRegistered() {
    registrationForm.style.display = 'none';
    alreadyRegisteredDiv.style.display = 'block';
    successMessageDiv.style.display = 'none';
}

// Mostrar mensagem de sucesso
function showSuccessMessage() {
    registrationForm.style.display = 'none';
    alreadyRegisteredDiv.style.display = 'none';
    successMessageDiv.style.display = 'block';
}

// Máscara de telefone
document.getElementById('phone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    
    if (value.length <= 2) {
        e.target.value = value;
    } else if (value.length <= 7) {
        e.target.value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    } else {
        e.target.value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
    }
});

// Mostrar notificação
function showNotification() {
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Mostrar notificação de erro
function showErrorNotification() {
    errorNotification.style.display = 'block';
    setTimeout(() => {
        errorNotification.style.display = 'none';
    }, 3000);
}

// Adicionar participante à lista
function addParticipantToDOM(index, participant) {
    const participantElement = document.createElement('div');
    participantElement.className = 'participant-card';
    participantElement.innerHTML = `
        <div class="participant-number">${index}</div>
        <div><strong>${participant.name}</strong></div>
        <div>${participant.phone}</div>
        <div>Nível: ${participant.level}</div>
    `;
    participantsContainer.appendChild(participantElement);
}

// Buscar participantes do Supabase
async function fetchParticipants() {
    try {
        showDebugInfo("Buscando participantes do Supabase...");
        
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw new Error(`Erro Supabase: ${error.message}`);
        }
        
        showDebugInfo(`Encontrados ${data.length} participantes`);
        return data;
    } catch (error) {
        console.error('Erro ao buscar participantes:', error);
        showDebugInfo(`Erro: ${error.message}`);
        return [];
    }
}

// Adicionar participante ao Supabase
async function addParticipant(participant) {
    try {
        showDebugInfo("Enviando dados para o Supabase...");
        
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([participant])
            .select();
        
        if (error) {
            throw new Error(`Erro Supabase: ${error.message}`);
        }
        
        showDebugInfo("Dados enviados com sucesso!");
        return data;
    } catch (error) {
        console.error('Erro ao adicionar participante:', error);
        showDebugInfo(`Erro no envio: ${error.message}`);
        throw error;
    }
}

// Verificar se o número já está registrado
async function isPhoneRegistered(phone) {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('phone')
            .eq('phone', phone);
        
        if (error) {
            throw new Error(`Erro Supabase: ${error.message}`);
        }
        
        return data && data.length > 0;
    } catch (error) {
        console.error('Erro ao verificar telefone:', error);
        return false;
    }
}

// Envio do formulário
registrationForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const level = document.getElementById('level').value;

    // Validação básica
    if (!name || !phone || !level) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    // Verificar formato do telefone
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
        alert("Por favor, insira um número de WhatsApp válido no formato (00) 00000-0000");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'VERIFICANDO...';
    showDebugInfo("Iniciando verificação...");

    try {
        // Verificar se o número já está cadastrado
        showDebugInfo("Verificando se o telefone já existe...");
        const alreadyRegistered = await isPhoneRegistered(phone);
        
        if (alreadyRegistered) {
            showDebugInfo("Telefone já cadastrado!");
            showErrorNotification();
            localStorage.setItem('registeredPhone', phone);
            showAlreadyRegistered();
            submitBtn.disabled = false;
            submitBtn.textContent = 'CONFIRMAR INSCRIÇÃO';
            return;
        }

        submitBtn.textContent = 'SALVANDO...';
        showDebugInfo("Salvando inscrição...");
        
        // Criar novo participante
        const newParticipant = {
            name: name,
            phone: phone,
            level: level,
            created_at: new Date().toISOString()
        };
        
        // Adicionar ao Supabase
        await addParticipant(newParticipant);
        
        // Armazenar localmente que este número está registrado
        localStorage.setItem('registeredPhone', phone);
        
        showSuccessMessage();
        registrationForm.reset();
        
        // Atualizar a lista de participantes
        await loadParticipants();
        
        showNotification();
        showDebugInfo("Processo concluído com sucesso!");
        
    } catch (error) {
        console.error("Erro completo:", error);
        showDebugInfo(`Erro completo: ${error.message}`);
        alert("Erro ao salvar inscrição. Tente novamente.");
        showErrorNotification();
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'CONFIRMAR INSCRIÇÃO';
    }
});

// Carregar participantes
async function loadParticipants() {
    participantsContainer.innerHTML = '<div class="loading">Carregando participantes...</div>';
    showDebugInfo("Carregando lista de participantes...");
    
    try {
        const participants = await fetchParticipants();
        
        participantsContainer.innerHTML = '';
        
        if (participants.length === 0) {
            participantsContainer.innerHTML = '<div class="loading">Nenhum participante inscrito ainda.</div>';
            totalParticipantsElement.textContent = '0';
            showDebugInfo("Nenhum participante encontrado");
            return;
        }
        
        // Já ordenado por created_at descendente via Supabase
        totalParticipantsElement.textContent = participants.length;
        
        // Mostrar apenas os 10 mais recentes
        const recentParticipants = participants.slice(0, 10);
        
        recentParticipants.forEach((participant, index) => {
            addParticipantToDOM(index + 1, participant);
        });
        
        showDebugInfo(`Lista carregada: ${participants.length} participantes totais`);
    } catch (error) {
        participantsContainer.innerHTML = '<div class="loading">Erro ao carregar participantes.</div>';
        console.error('Erro ao carregar participantes:', error);
        showDebugInfo(`Erro ao carregar: ${error.message}`);
    }
}

// Inicializar a aplicação
function initApp() {
    showDebugInfo("Aplicação inicializada. Aguardando credenciais Supabase...");
    checkIfAlreadyRegistered();
    loadParticipants();
}

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', initApp);