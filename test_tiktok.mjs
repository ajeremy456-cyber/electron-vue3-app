import { TikTokLiveConnection } from 'tiktok-live-connector';

console.log('測試 TikTok Live 連線...');
console.log('房間：t7vomg9\n');

const connection = new TikTokLiveConnection('t7vomg9', {});

const messages = [];

connection.on('chat', (data) => {
  const nickname = data.user?.nickname || data.uniqueId || '匿名';
  console.log(`💬 [${nickname}]: ${data.comment}`);
  messages.push({ type: 'chat', nickname, text: data.comment });
  if (messages.length >= 5) {
    console.log('\n已收到 5 條訊息，測試完成！');
    connection.disconnect();
    process.exit(0);
  }
});

connection.on('gift', (data) => {
  const nickname = data.user?.nickname || data.uniqueId || '匿名';
  console.log(`🎁 [${nickname}] 送禮: ${data.giftName} x${data.repeatCount}`);
});

connection.on('member', (data) => {
  const nickname = data.user?.nickname || data.uniqueId || '匿名';
  console.log(`👋 [${nickname}] 進場`);
});

connection.on('streamEnd', () => {
  console.log('📴 直播結束');
  process.exit(0);
});

connection.on('disconnect', () => {
  console.log('⚠️ 中斷連線');
});

connection.on('error', (err) => {
  console.error('❌ 錯誤:', err.message);
  process.exit(1);
});

try {
  await connection.connect();
  console.log('✅ 已連接！等待訊息...\n');
} catch (err) {
  console.error('❌ 連接失敗:', err.message);
  process.exit(1);
}

// Timeout 20s
setTimeout(() => {
  console.log(`\n⏱️  超時（收到 ${messages.length} 條訊息）`);
  connection.disconnect();
  process.exit(messages.length > 0 ? 0 : 1);
}, 20000);