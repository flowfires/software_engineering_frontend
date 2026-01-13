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
      setData(res.data);
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
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/auth/avatar', formData);
      message.success('头像上传成功');
      loadProfile();
      onSuccess("ok");
    } catch (err) {
      console.error(err);
      message.error('头像上传失败');
      onError(err);
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
                  src={data?.avatar_url} 
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