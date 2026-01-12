// src/pages/ImageGeneration.jsx
import React, { useState } from 'react';
import { Card, Input, Button, message, Typography, Breadcrumb, Image, Empty, theme, Spin } from 'antd';
import { FileImageOutlined, ArrowLeftOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const ImageGeneration = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  
  // 状态管理
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  // 处理生成请求
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return message.warning('请输入图片描述');
    }

    setLoading(true);
    setImageUrl(null); // 清空旧图

    try {
      // 调用后端生图接口
      const res = await api.post('/media/image/generate', { 
        prompt: prompt,
        size: "1024x1024" // 可以根据你的API需求调整参数
      });

      // 假设后端返回结构是 { image_url: "http://..." }
      // 如果你的后端返回不同，请在这里调整
      const url = res.data.image_url || res.data.url || res.data.data?.[0]?.url;
      
      if (url) {
        setImageUrl(url);
        message.success('图片生成成功！');
      } else {
        message.error('生成成功但未获取到图片地址');
      }
    } catch (err) {
      console.error(err);
      message.error('图片生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      
      {/* 顶部导航 */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[
          { title: <Link to="/resources">资源中心</Link> },
          { title: 'AI 图片生成' },
        ]} />
      </div>

      {/* 标题栏 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/resources')} 
          type="text"
        >
          返回
        </Button>
        <Title level={3} style={{ margin: 0 }}>AI 图片生成</Title>
      </div>

      {/* 主要内容区域 */}
      <Card bordered={false} style={{ boxShadow: token.boxShadowTertiary }}>
        
        {/* 输入区 */}
        <div style={{ marginBottom: 30 }}>
          <Title level={5}>图片描述提示词</Title>
          <Paragraph type="secondary">
            越详细的描述（包括风格、光线、构图）效果越好。例如："中国水墨画风格的荷塘月色，高清，意境优美"
          </Paragraph>
          <TextArea 
            rows={4} 
            placeholder="在此输入想要生成的图片描述..." 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
            style={{ fontSize: '16px', marginBottom: 16 }}
            showCount
            maxLength={500}
          />
          <Button 
            type="primary" 
            size="large" 
            onClick={handleGenerate} 
            loading={loading}
            icon={loading ? <ReloadOutlined spin /> : <FileImageOutlined />}
            style={{ minWidth: 160, height: 48, fontSize: 16 }}
          >
            {loading ? '正在绘制中...' : '开始生成图片'}
          </Button>
        </div>

        {/* 结果展示区 */}
        <div style={{ 
          background: '#f5f5f5', 
          borderRadius: 8, 
          minHeight: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 24,
          border: '1px dashed #d9d9d9'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" tip="AI 正在挥毫泼墨..." />
            </div>
          ) : imageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <Image 
                src={imageUrl} 
                style={{ maxHeight: 500, maxWidth: '100%', borderRadius: 8, boxShadow: token.boxShadow }}
              />
              <div style={{ marginTop: 24 }}>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  href={imageUrl} 
                  target="_blank" 
                  download="ai-generated-image.png"
                >
                  下载原图
                </Button>
              </div>
            </div>
          ) : (
            <Empty description="暂无生成的图片，请在上方输入描述开始生成" />
          )}
        </div>

      </Card>
    </div>
  );
};

export default ImageGeneration;