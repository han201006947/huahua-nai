<script setup>
// 引入 Vue 响应式 API
import { ref, computed, onMounted } from 'vue'
// 退出登录
import { logoutAdmin } from '../composables/useAdminAuth.js'
import {
  readFileAsBase64,
  requestAddAlbum,
  requestAddCategory,
  requestDeleteCategory,
  requestListCategories,
} from '../composables/useGalleryAdminApi.js'
// 其他窗口增删后刷新本面板下拉
import { useGallerySyncListener } from '../composables/useGallerySync.js'

// 父组件在增删成功后刷新网格
const emit = defineEmits(['changed'])

// 与父组件同步：管理面板是否展开（展开后网格显示删除按钮）
const panelOpen = defineModel('open', { type: Boolean, default: false })

// 分类选项（彩绘/法式等）
const categories = ref([])
// 新增分类表单
const newCategoryName = ref('')
const newCategoryTitlePrefix = ref('')
// 新增表单：选中的分类 key
const addCategoryKey = ref('caihui')
// 新增表单：自定义标题（可空，空则用自动生成标题）
const addTitle = ref('')
// 新增表单：是否标记「仅看款式」
const addStylePreview = ref(false)
// 新增表单：待上传文件列表
const addFiles = ref(null)
// 分类区 / 款式区各自独立 loading，避免点一个两个按钮都在「处理中」
const busyCategory = ref(false)
const busyAlbum = ref(false)
// 操作结果提示
const message = ref('')
// 错误提示
const error = ref('')

// 可删除的自建分类（内置彩绘/法式等不可删）
const customCategories = computed(() => categories.value.filter((c) => c.isCustom))

// 面板打开时拉取分类与相册列表
onMounted(() => {
  refreshMeta()
})

// 电脑/手机多窗口：一方改完另一方管理面板下拉也刷新
useGallerySyncListener(() => refreshMeta())

// 读取分类列表并同步下拉选中项
async function refreshMeta() {
  error.value = ''
  try {
    const catData = await requestListCategories()
    categories.value = catData.categories || []
    const keys = categories.value.map((c) => c.key)
    if (!keys.includes(addCategoryKey.value) && categories.value.length) {
      addCategoryKey.value = categories.value[0].key
    }
  } catch (e) {
    error.value = e.message || String(e)
  }
}

// 提交新增分类
async function submitAddCategory() {
  error.value = ''
  message.value = ''
  const name = newCategoryName.value.trim()
  if (!name) {
    error.value = '请填写分类名称'
    return
  }
  busyCategory.value = true
  try {
    const data = await requestAddCategory({
      category: name,
      titlePrefix: newCategoryTitlePrefix.value.trim(),
    })
    categories.value = data.categories || []
    if (data.category?.key) addCategoryKey.value = data.category.key
    newCategoryName.value = ''
    newCategoryTitlePrefix.value = ''
    message.value = `已添加分类：${data.category?.category || name}，可在下方添加款式`
    emit('changed')
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    busyCategory.value = false
  }
}

// 删除自建分类
async function submitDeleteCategory(cat) {
  error.value = ''
  message.value = ''
  if (
    !window.confirm(
      `确定删除分类「${cat.category}」？\n该分类下所有款式与图片/视频将一并删除，且不可恢复。`
    )
  ) {
    return
  }
  busyCategory.value = true
  try {
    const data = await requestDeleteCategory(cat.key)
    categories.value = data.categories || []
    const keys = categories.value.map((c) => c.key)
    if (!keys.includes(addCategoryKey.value) && categories.value.length) {
      addCategoryKey.value = categories.value[0].key
    }
    message.value = `已删除分类：${cat.category}，下方 Tab 与作品集已同步`
    emit('changed')
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    busyCategory.value = false
  }
}

// 将 File 转为 base64
async function filesFromInput(list) {
  const files = []
  for (const file of list) {
    files.push({ name: file.name, data: await readFileAsBase64(file) })
  }
  return files
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
  busyAlbum.value = true
  try {
    const files = await filesFromInput(list)
    message.value = '正在上传并同步线上，请稍候…'
    const data = await requestAddAlbum({
      categoryKey: addCategoryKey.value,
      title: addTitle.value.trim(),
      stylePreview: addStylePreview.value,
      files,
    })
    message.value = `已添加款式：${data.album?.title || data.albumId}（线上约 1 分钟内更新）`
    addTitle.value = ''
    addStylePreview.value = false
    if (input) input.value = ''
    await refreshMeta()
    emit('changed')
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    busyAlbum.value = false
  }
}

// 切换面板展开
function togglePanel() {
  panelOpen.value = !panelOpen.value
}

// 退出店主登录
function handleLogout() {
  logoutAdmin()
  panelOpen.value = false
  window.location.reload()
}
</script>

<template>
  <!-- 本地开发专用：作品集增删（不会随 deploy 上线） -->
  <div class="gallery-admin">
    <button type="button" class="admin-toggle" @click="togglePanel">
      {{ panelOpen ? '收起款式管理' : '管理款式（店主已登录）' }}
    </button>
    <button type="button" class="admin-logout" @click="handleLogout">退出登录</button>

    <div v-if="panelOpen" class="admin-panel">
      <p class="admin-tip">
        已验证店主 <strong>15235952769</strong>。改动会同步到 GitHub，约 1 分钟内顾客扫码也能看到。
        仅店主保存的登录二维码可进入此面板。
      </p>

      <p v-if="error" class="admin-error">{{ error }}</p>
      <p v-if="message" class="admin-ok">{{ message }}</p>

      <div class="admin-grid">
        <!-- 添加分类 -->
        <section class="admin-block">
          <h4 class="admin-heading">添加分类</h4>
          <label class="admin-field">
            <span>分类名称</span>
            <input
              v-model="newCategoryName"
              type="text"
              placeholder="如：贴片甲、延长甲"
              :disabled="busyCategory"
            />
          </label>
          <label class="admin-field">
            <span>款式标题前缀（可选）</span>
            <input
              v-model="newCategoryTitlePrefix"
              type="text"
              placeholder="留空则与分类名相同"
              :disabled="busyCategory"
            />
          </label>
          <button
            type="button"
            class="admin-btn admin-btn-cat"
            :disabled="busyCategory"
            @click="submitAddCategory"
          >
            {{ busyCategory ? '处理中…' : '添加分类' }}
          </button>
          <!-- 自建分类可删，删后下方 Tab 与网格同步刷新 -->
          <div v-if="customCategories.length" class="admin-cat-delete">
            <p class="admin-subheading">删除自建分类</p>
            <ul class="admin-cat-list">
              <li v-for="c in customCategories" :key="c.key" class="admin-cat-item">
                <span>{{ c.category }}</span>
                <button
                  type="button"
                  class="admin-btn admin-btn-del-cat"
                  :disabled="busyCategory"
                  @click="submitDeleteCategory(c)"
                >
                  删除
                </button>
              </li>
            </ul>
          </div>
        </section>

        <!-- 添加款式 -->
        <section class="admin-block">
          <h4 class="admin-heading">添加款式</h4>
          <label class="admin-field">
            <span>分类</span>
            <select v-model="addCategoryKey" :disabled="busyAlbum">
              <option v-for="c in categories" :key="c.key" :value="c.key">
                {{ c.category }}（{{ c.titlePrefix }}）
              </option>
            </select>
          </label>
          <label class="admin-field">
            <span>标题（可选）</span>
            <input v-model="addTitle" type="text" placeholder="留空则自动生成编号标题" :disabled="busyAlbum" />
          </label>
          <label class="admin-check">
            <input v-model="addStylePreview" type="checkbox" :disabled="busyAlbum" />
            <span>穿戴甲贴手 · 仅看款式</span>
          </label>
          <label class="admin-field">
            <span>图片 / 视频</span>
            <input ref="addFiles" type="file" accept="image/*,video/*" multiple :disabled="busyAlbum" />
          </label>
          <button type="button" class="admin-btn admin-btn-add" :disabled="busyAlbum" @click="submitAdd">
            {{ busyAlbum ? '处理中…' : '添加款式' }}
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-admin {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.admin-logout {
  padding: 0.45rem 0.85rem;
  border: 1px solid #dccfbf;
  border-radius: 999px;
  background: #fff;
  color: #6b5344;
  font-size: 0.82rem;
  cursor: pointer;
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

.admin-block-full {
  max-width: 420px;
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

.admin-btn-cat {
  background: #7a5230;
  color: #fff;
}

.admin-cat-delete {
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px dashed #e8dccf;
}

.admin-subheading {
  margin: 0 0 0.45rem;
  font-size: 0.82rem;
  color: #6b5344;
}

.admin-cat-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.admin-cat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  font-size: 0.82rem;
  color: #5c4033;
}

.admin-btn-del-cat {
  padding: 0.25rem 0.55rem;
  border: none;
  border-radius: 6px;
  background: #b42318;
  color: #fff;
  font-size: 0.78rem;
  cursor: pointer;
}

.admin-btn-del-cat:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
