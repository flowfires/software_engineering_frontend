import React, { useEffect, useState } from 'react';
import { 
  Card, Avatar, Typography, Descriptions, Tag, Space, Button, 
  Spin, message, Modal, Form, Input, InputNumber, Select, Upload 
} from 'antd';
import { 
  UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, 
  EditOutlined, UploadOutlined, BankOutlined, BookOutlined 
} from '@ant-design/icons';
import api from '../services/api';
import useAuthStore from '../stores/authStore'

const { Title, Paragraph } = Typography;
const { Option } = Select;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile');
      console.log('[Profile] loadProfile response:', res.data);
      setData(res.data);

      // 同步到全局 auth store：保持 token 不变，只更新 user
      try {
        const current = useAuthStore.getState();
        const currentToken = current?.token;
        if (typeof currentToken !== 'undefined' && currentToken !== null) {
          // 保持 token，更新 user（会触发 UI 的重新渲染，比如 Header 的头像）
          current.setAuth(currentToken, res.data);
        }
      } catch (e) {
        console.warn('[Profile] 同步到 authStore 失败：', e);
      }

    } catch (err) {
      console.error(err);
      message.error('无法加载个人信息');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEditSubmit = async (values) => {
    setUpdating(true);
    try {
      const payload = {
        ...values,
        teaching_style: Array.isArray(values.teaching_style) ? values.teaching_style : []
      };
      await api.put('/auth/profile', payload);
      message.success('个人信息更新成功');
      setIsEditModalVisible(false);
      loadProfile();
    } catch (err) {
      console.error(err);
      message.error('更新失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  const showEditModal = () => {
    form.setFieldsValue({
      full_name: data.full_name,
      phone: data.phone,
      school: data.school,
      subject: data.subject,
      title: data.title,
      teaching_style: data.teaching_style || [],
      personal_desc: data.personal_desc,
      years_of_experience: data.years_of_experience
    });
    setIsEditModalVisible(true);
  };

  const customUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);

    // 快速校验：必须是图片文件
    if (!file || !file.type || !file.type.startsWith('image/')) {
      message.error('请上传图片文件（jpg/png 等）');
      setUploading(false);
      onError && onError(new Error('不是图片文件'));
      return;
    }

    // 参数：允许的最大最终大小（字节）
    const MAX_FINAL_SIZE = 2 * 1024 * 1024; // 2MB
    const MAX_INPUT_SIZE = 15 * 1024 * 1024; // 15MB，过大的源文件直接提示用户

    if (file.size > MAX_INPUT_SIZE) {
      message.error('图片过大，请选择小于 15MB 的图片并重试');
      setUploading(false);
      onError && onError(new Error('源文件过大'));
      return;
    }

    const readFileAsDataURL = (f) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsDataURL(f);
      });

    const approxDataURLSize = (dataUrl) => {
      const base64 = (dataUrl || '').split(',')[1] || '';
      return Math.ceil((base64.length * 3) / 4);
    };

    const compressDataUrl = async (dataUrl, maxSize) => {
      // 通过 canvas 缩放 + 调整质量来尝试把图片压缩到 maxSize 以下
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = async () => {
          const originW = img.width;
          const originH = img.height;

          // 初始缩放因子（若图片宽度超过 1024，会先限制宽度）
          let scale = Math.min(1, 1024 / originW);
          let canvasW = Math.floor(originW * scale);
          let canvasH = Math.floor(originH * scale);

          let quality = 0.9;

          const makeDataUrl = (w, h, q) => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            return canvas.toDataURL('image/jpeg', q);
          };

          // 优先尝试不同质量，不断降低质量；如果质量降到 0.5 仍不行，则继续缩小尺寸
          for (let round = 0; round < 6; round++) {
            for (let q = quality; q >= 0.5; q -= 0.1) {
              const d = makeDataUrl(canvasW, canvasH, q);
              if (approxDataURLSize(d) <= maxSize) {
                resolve(d);
                return;
              }
            }
            // 缩小尺寸再试
            canvasW = Math.floor(canvasW * 0.8);
            canvasH = Math.floor(canvasH * 0.8);
            if (canvasW < 50 || canvasH < 50) break; // 防止过小
          }

          // 无法压到指定大小，则返回最后一次生成的（尽量小的）数据
          resolve(makeDataUrl(Math.max(50, canvasW), Math.max(50, canvasH), 0.5));
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
    };

    try {
      const dataUrl = await readFileAsDataURL(file);
      let finalDataUrl = dataUrl;
      let size = approxDataURLSize(finalDataUrl);
      console.log('[Profile] 原始图片大小 (bytes):', file.size, 'approx base64 bytes:', size);

      if (size > MAX_FINAL_SIZE) {
        const compressed = await compressDataUrl(dataUrl, MAX_FINAL_SIZE);
        if (!compressed) {
          message.error('图片处理失败，请重试或选择其它图片');
          setUploading(false);
          onError && onError(new Error('图片处理失败'));
          return;
        }
        finalDataUrl = compressed;
        size = approxDataURLSize(finalDataUrl);
        console.log('[Profile] 压缩后 base64 大小 (bytes):', size);

        if (size > MAX_FINAL_SIZE) {
          message.error('图片过大，无法压缩到允许范围，请选择更小的图片或裁剪后再试（目标 ≤ 2MB）');
          setUploading(false);
          onError && onError(new Error('压缩后仍然过大'));
          return;
        }
      }

      // 按照后端 OpenAPI 要求，使用 multipart/form-data，字段名为 `file`
      const formData = new FormData();
      if (finalDataUrl && finalDataUrl.startsWith('data:')) {
        // 将 Data URL 转为 Blob
        const dataURLtoBlob = (dataurl) => {
          const arr = dataurl.split(',');
          const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
          const bstr = atob(arr[1] || '');
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new Blob([u8arr], { type: mime });
        };
        const blob = dataURLtoBlob(finalDataUrl);
        formData.append('file', blob, 'avatar.jpg');
      } else {
        // 如果没有 dataUrl（例如未压缩，使用原始 file）
        formData.append('file', file, file.name || 'avatar.jpg');
      }

      await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      message.success('头像上传成功');
      loadProfile();
      onSuccess && onSuccess('ok');
    } catch (err) {
      console.error('[Profile] 上传失败：', err?.code, err?.message, err);
      if (err?.response) {
        console.error('[Profile] 服务器响应：', err.response.status, err.response.data);
        if (err.response.status === 422) {
          // 后端验证错误（常见原因：缺少 file 字段 / 文件太大 / 文件类型不符合）
          const serverMsg = err.response.data?.detail || JSON.stringify(err.response.data);
          message.error('上传失败：参数验证错误，请检查文件（查看控制台以获取更多细节）');
          console.warn('[Profile] 422 详情：', serverMsg);
        } else if (err.response.status === 413) {
          message.error('上传失败：文件太大，服务器拒绝接收（413）');
        } else {
          message.error('上传失败：服务器返回 ' + err.response.status);
        }
      } else if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        message.error('上传失败：网络错误或服务器不可达，请稍后重试');
      } else {
        message.error('头像上传失败');
      }
      onError && onError(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" tip="正在加载个人档案..." />
      </div>
    );
  }

  // 兼容后端可能返回 avatar_url 或 avatar_base64
  const avatarSrc = data?.avatar_url || (data?.avatar_base64 ? (data.avatar_base64.startsWith('data:') ? data.avatar_base64 : `data:image/jpeg;base64,${data.avatar_base64}`) : undefined);
  console.log('[Profile] avatarSrc:', avatarSrc);

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Card bordered={false} bodyStyle={{ padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
          
          {/* 头像区域 - 已移除裁剪组件 */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {/* 🔴 删除: <ImgCrop rotationSlider> */}
            <Upload 
              customRequest={customUpload}
              showUploadList={false}
            >
              <div style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
                <Avatar 
                  size={120} 
                  src={avatarSrc} 
                  icon={<UserOutlined />} 
                  style={{ border: '4px solid #f0f2f5' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#1890ff',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff'
                }}>
                  {uploading ? <Spin size="small" /> : <UploadOutlined />}
                </div>
              </div>
            </Upload>
            {/* 🔴 删除: </ImgCrop> */}
          </div>

          <Title level={2} style={{ marginBottom: 4 }}>
            {data?.full_name || data?.username || '未命名教师'}
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            {data?.school || '未填写学校'} · {data?.subject || '未填写学科'}教师
          </Paragraph>
          
          <Space size="large" style={{ marginTop: 10 }}>
            <Tag icon={<SafetyCertificateOutlined />} color="blue">
              {data?.role === 'teacher' ? '认证教师' : '普通用户'}
            </Tag>
            <Tag color={data?.is_active ? 'success' : 'error'}>
              {data?.is_active ? '账户状态: 正常' : '账户状态: 停用'}
            </Tag>
          </Space>

          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={showEditModal}
            style={{ marginTop: 24 }}
          >
            编辑个人资料
          </Button>
        </div>

        <Descriptions title="基本信息" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
          <Descriptions.Item label={<><UserOutlined /> 用户名</>}>
            {data?.username}
          </Descriptions.Item>
          <Descriptions.Item label={<><MailOutlined /> 邮箱</>}>
            {data?.email}
          </Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> 电话</>}>
            {data?.phone || '未填写'}
          </Descriptions.Item>
          <Descriptions.Item label={<><BankOutlined /> 职称</>}>
            {data?.title || '未填写'}
          </Descriptions.Item>
          <Descriptions.Item label={<><BookOutlined /> 教龄</>}>
            {data?.years_of_experience ? `${data.years_of_experience} 年` : '未填写'}
          </Descriptions.Item>
          <Descriptions.Item label="教学风格">
            {data?.teaching_style && data.teaching_style.length > 0 ? (
              <Space wrap>
                {data.teaching_style.map((tag, index) => (
                  <Tag key={index} color="geekblue">{tag}</Tag>
                ))}
              </Space>
            ) : '暂无标签'}
          </Descriptions.Item>
          <Descriptions.Item label="个人简介" span={2}>
            {data?.personal_desc || '这位老师很懒，什么都没有写...'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="编辑个人资料"
        open={isEditModalVisible}
        onOk={form.submit}
        onCancel={() => setIsEditModalVisible(false)}
        confirmLoading={updating}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item label="真实姓名" name="full_name" rules={[{ max: 100 }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="联系电话" name="phone" rules={[{ max: 20 }]}>
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item label="职称" name="title" rules={[{ max: 50 }]}>
              <Input placeholder="例如：高级教师" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="所在学校" name="school" rules={[{ max: 100 }]}>
              <Input placeholder="请输入学校名称" />
            </Form.Item>
            <Form.Item label="教授学科" name="subject" rules={[{ max: 50 }]}>
              <Input placeholder="例如：数学" />
            </Form.Item>
          </div>
          <Form.Item label="教龄 (年)" name="years_of_experience">
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="教学风格标签" name="teaching_style">
            <Select mode="tags" placeholder="输入标签后回车，如：幽默风趣、严谨" tokenSeparators={[',', '，']} />
          </Form.Item>
          <Form.Item label="个人简介" name="personal_desc">
            <Input.TextArea rows={4} placeholder="简单介绍一下自己..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;