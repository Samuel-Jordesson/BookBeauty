// Script de teste para verificar funcionalidades do Supabase
// Execute no console do navegador (F12 > Console)

console.log('🔍 Testando conexão com Supabase...');

// Teste 1: Verificar conexão
async function testConnection() {
  try {
    const { data, error } = await supabase.from('salons').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Conexão com banco: OK');
    console.log(`📊 Total de salões: ${data || 0}`);
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  }
}

// Teste 2: Verificar Storage
async function testStorage() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    console.log('✅ Storage configurado:', data);
    
    const salonAssetsBucket = data.find(bucket => bucket.name === 'salon-assets');
    if (salonAssetsBucket) {
      console.log('✅ Bucket salon-assets: OK');
    } else {
      console.log('⚠️ Bucket salon-assets: NÃO ENCONTRADO');
    }
  } catch (error) {
    console.error('❌ Erro no Storage:', error);
  }
}

// Teste 3: Verificar autenticação
async function testAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ Usuário logado:', session.user.email);
    } else {
      console.log('ℹ️ Nenhum usuário logado');
    }
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes...\n');
  
  await testConnection();
  console.log('');
  
  await testStorage();
  console.log('');
  
  await testAuth();
  console.log('');
  
  console.log('✨ Testes concluídos!');
}

// Executar
runAllTests();
