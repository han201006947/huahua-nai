<script setup>
// 引入 Vue 响应式 API
import { ref, onMounted } from 'vue'

// 父组件在增删成功后刷新网格
const emit = defineEmits(['changed'])

// 分类选项（彩绘/法式等）
const categories = ref([])
// 当前全部相册，供删除列表展示
const allAlbums = ref([])
// 新增表单：选中的分类 key
const addCategoryKey = ref('caihui')
// 新增表单：自定义标题（可空，空则用自动生成标题）
const addTitle = ref('')
// 新增表单：是否标记「仅看款式」
const addStylePreview = ref(false)
// 新增表单：待上传文件列表
const addFiles = ref(null)
// 删除表单：选中的相册 id
const deleteAlbumId = ref('')
// 面板展开/收起
const panelOpen = ref(false)
// 请求进行中
const busy = ref(false)
// 操作结果提示
const message = ref('')
// 错误提示
const error = ref('')

// 面板打开时拉取分类与相册列表
onMounted(() => {
  refreshMeta()
})

// 读取分类与相册元数据
async function refreshMeta() {
  error.value = ''
  try {
    const [catRes, albumRes] = await Promise.all([
      fetch('/api/gallery/categories'),
      fetch('/api/gallery/albums'),
    ])
    if (!catRes.ok || !albumRes.ok) throw new Error('无法连接本地管理接口，请确认已 npm run dev')
    const catData = await catRes.json()
    const albumData = await albumRes.json()
    categories.value = catData.categories || []
    allAlbums.value = albumData.albums || []
    if (!deleteAlbumId.value && allAlbums.value.length) {
      deleteAlbumId.value = allAlbums.value[0].id
    }
  } catch (e) {
    error.value = e.message || String(e)
  }
}

// 将 File 转为 base64 供 API 写入 public
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`))
    reader.readAsDataURL(file)
  })
}

// 提交新增款式
async function submitAdd() {
  error.value = ''
  message.value = ''
  const input = addFiles.value
  const list = input?.files
  if (!list?.length) {
    error.value = '请选择至少一张图片或一个视频'
    return
  }
  busy.value = true
  try {
    const files = []
    for (const file of list) {
      const data = await readFileAsBase64(file)
      files.push({ name: file.name, data })
    }
    const res = await fetch('/api/gallery/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryKey: addCategoryKey.value,
        title: addTitle.value.trim(),
        stylePreview: addStylePreview.value,
        files,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '添加失败')
    message.value = `已添加款式：${data.album?.title || data.albumId}`
    addTitle.value = ''
    addStylePreview.value = false
    if (input) input.value = ''
    await refreshMeta()
    emit('changed')
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    busy.value = false
  }
}

// 确认后删除款式
async function submitDelete() {
  error.value = ''
  message.value = ''
  if (!deleteAlbumId.value) {
    error.value = '请选择要删除的款式'
    return
  }
  const target = allAlbums.value.find((a) => a.id === deleteAlbumId.value)
  const label = target?.title || deleteAlbumId.value
  if (!window.confirm(`确定删除「${label}」？\n将删除 public 内对应图片/视频，且不可恢复。`)) return
  busy.value = true
  try {
    const res = await fetch(`/api/gallery/albums/${encodeURIComponent(deleteAlbumId.value)}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '删除失败')
    message.value = `已删除：${label}`
    deleteAlbumId.value = ''
    await refreshMeta()
    emit('changed')
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    busy.value = false
  }
}

// 切换面板展开
function togglePanel() {
  panelOpen.value = !panelOpen.value
}
</script>

<template>
  <!-- 本地开发专用：作品集增删（不会随 deploy 上线） -->
  <div class="gallery-admin">
    <button type="button" class="admin-toggle" @click="togglePanel">
      {{ panelOpen ? '收起款式管理' : '管理款式（仅本地）' }}
    </button>

    <div v-if="panelOpen" class="admin-panel">
      <p class="admin-tip">
        仅在 <strong>npm run dev</strong> 下可用；会直接改动 <code>public/</code> 并同步
        <code>galleryAlbums.js</code>。满意后再自行 <code>npm run deploy</code> 上传 GitHub。
      </p>

      <p v-if="error" class="admin-error">{{ error }}</p>
      <p v-if="message" class="admin-ok">{{ message }}</p>

      <div class="admin-grid">
        <!-- 新增款式 -->
        <section class="admin-block">
          <h4 class="admin-heading">添加款式</h4>
          <label class="admin-field">
            <span>分类</span>
            <select v-model="addCategoryKey" :disabled="busy">
              <option v-for="c in categories" :key="c.key" :value="c.key">
                {{ c.category }}（{{ c.titlePrefix }}）
              </option>
            </select>
          </label>
          <label class="admin-field">
            <span>标题（可选）</span>
            <input v-model="addTitle" type="text" placeholder="留空则自动生成编号标题" :disabled="busy" />
          </label>
          <label class="admin-check">
            <input v-model="addStylePreview" type="checkbox" :disabled="busy" />
            <span>穿戴甲贴手 · 仅看款式</span>
          </label>
          <label class="admin-field">
            <span>图片 / 视频</span>
            <input ref="addFiles" type="file" accept="image/*,video/*" multiple :disabled="busy" />
          </label>
          <button type="button" class="admin-btn admin-btn-add" :disabled="busy" @click="submitAdd">
            {{ busy ? '处理中…' : '添加款式' }}
          </button>
        </section>

        <!-- 删除款式 -->
        <section class="admin-block">
          <h4 class="admin-heading">删除款式</h4>
          <label class="admin-field">
            <span>选择款式</span>
            <select v-model="deleteAlbumId" :disabled="busy">
              <option v-for="a in allAlbums" :key="a.id" :value="a.id">
                [{{ a.category }}] {{ a.title }}（{{ a.id }}）
              </option>
            </select>
          </label>
          <button type="button" class="admin-btn admin-btn-del" :disabled="busy" @click="submitDelete">
            {{ busy ? '处理中…' : '删除所选款式' }}
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-admin {
  margin-bottom: 1.5rem;
}

.admin-toggle {
  padding: 0.45rem 1rem;
  border: 1px dashed #c9a87c;
  border-radius: 999px;
  background: #fff8f0;
  color: #7a5230;
  font-size: 0.85rem;
  cursor: pointer;
}

.admin-panel {
  margin-top: 0.75rem;
  padding: 1rem 1.1rem;
  border: 1px solid #e8dccf;
  border-radius: 12px;
  background: #fffcf8;
}

.admin-tip {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  line-height: 1.55;
  color: #6b5344;
}

.admin-tip code {
  font-size: 0.78rem;
  background: #f3ebe3;
  padding: 0 0.25rem;
  border-radius: 4px;
}

.admin-error {
  margin: 0 0 0.5rem;
  color: #b42318;
  font-size: 0.85rem;
}

.admin-ok {
  margin: 0 0 0.5rem;
  color: #067647;
  font-size: 0.85rem;
}

.admin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 720px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}

.admin-block {
  padding: 0.75rem;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #efe6dc;
}

.admin-heading {
  margin: 0 0 0.65rem;
  font-size: 0.95rem;
  color: #5c4033;
}

.admin-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.55rem;
  font-size: 0.82rem;
  color: #6b5344;
}

.admin-field input,
.admin-field select {
  padding: 0.4rem 0.5rem;
  border: 1px solid #dccfbf;
  border-radius: 6px;
  font-size: 0.85rem;
}

.admin-check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
  font-size: 0.82rem;
  color: #6b5344;
}

.admin-btn {
  margin-top: 0.35rem;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.admin-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.admin-btn-add {
  background: #5c4033;
  color: #fff;
}

.admin-btn-del {
  background: #fdecea;
  color: #b42318;
  border: 1px solid #fecdca;
}
</style>
