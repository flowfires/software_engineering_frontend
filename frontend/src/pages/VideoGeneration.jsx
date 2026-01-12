// src/pages/VideoGeneration.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Alert, message, Typography, Breadcrumb, theme } from 'antd';
import { VideoCameraOutlined, LoadingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const { TextArea } = Input;
const { Title } = Typography;

const VideoGeneration = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [status, setStatus] = useState(''); 
  const [errorMsg, setErrorMsg] = useState('');
  
  const pollTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return message.warning('请输入视频描述');
    setLoading(true);
    setVideoUrl(null);
    setStatus('PROCESSING');
    setErrorMsg('');
    
    try {
      const res = await api.post('/media/video/generate', { prompt });
      const newTaskId = res.data.task_id;
      message.success('任务已提交');
      startPolling(newTaskId);
    } catch (err) {
      console.error(err);
      message.error('任务提交失败');
      setLoading(false);
      setStatus('FAIL');
    }
  };

  const startPolling = (tid) => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const res = await api.get(`/media/video/status/${tid}`);
        const { task_status, video_url, error } = res.data;
        setStatus(task_status);

        if (task_status === 'SUCCESS') {
          clearInterval(pollTimer.current);
          setVideoUrl(video_url);
          setLoading(false);
          message.success('视频生成成功！');
        } else if (task_status === 'FAIL') {
          clearInterval(pollTimer.current);
          setLoading(false);
          setErrorMsg(error || '生成失败');
        }
      } catch (err) {
        console.error('轮询出错', err);
      }
    }, 3000);
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[
          { title: <Link to="/resources">资源中心</Link> },
          { title: 'AI 视频生成' },
        ]} />
      </div>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/resources')} type="text">返回</Button>
        <Title level={3} style={{ margin: 0 }}>AI 视频生成</Title>
      </div>

      <Card bordered={false} style={{ boxShadow: token.boxShadowTertiary }}>
        <div style={{ marginBottom: 20 }}>
          <Title level={5}>视频描述提示词</Title>
          <TextArea 
            rows={4} 
            placeholder="描述您想看到的动态场景..." 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button 
          type="primary" 
          size="large" 
          onClick={handleGenerate} 
          loading={loading}
          block
          icon={<VideoCameraOutlined />}
        >
          {loading ? 'AI 正在生成中...' : '开始生成视频'}
        </Button>

        <div style={{ marginTop: 30 }}>
          {status === 'PROCESSING' && <Alert message="正在生成中，请耐心等待..." type="info" showIcon icon={<LoadingOutlined />} />}
          {status === 'FAIL' && <Alert message="生成失败" description={errorMsg} type="error" showIcon />}
          {status === 'SUCCESS' && videoUrl && (
            <div style={{ textAlign: 'center', background: '#000', padding: 20, borderRadius: 8 }}>
              <video controls src={videoUrl} style={{ maxWidth: '100%', maxHeight: 400 }} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VideoGeneration;