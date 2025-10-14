import React from 'react';
import { Button, Card, CardHeader, CardBody, Container, Header, Footer } from '../components';

interface HomePageProps {
  onNavigate?: (page: string) => void;
  player?: {
    name: string;
    avatar?: string;
    wins?: number;
    totalGames?: number;
  } | null;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, player }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light-blue)' }}>
      <Container size="xl">
          <Header 
            title="スピードマッチ"
            player={player || undefined}
            showNavigation={true}
            onNavigate={onNavigate}
          />
          
          <main>
            <div className="text-center mb-6">
              <h1 className="h1">スピードマッチへようこそ！</h1>
              <p className="text-lg text-secondary">
                スピード感あふれるカードマッチングゲームを楽しもう
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card variant="elevated">
                <CardHeader>
                  <h3>ルーム作成</h3>
                </CardHeader>
                <CardBody>
                  <p className="mb-4">新しいゲームルームを作成して友達を招待しよう</p>
                  <Button variant="primary" fullWidth>
                    ルーム作成
                  </Button>
                </CardBody>
              </Card>
              
              <Card variant="elevated">
                <CardHeader>
                  <h3>ルーム参加</h3>
                </CardHeader>
                <CardBody>
                  <p className="mb-4">ルームコードを入力して既存のゲームに参加しよう</p>
                  <Button variant="secondary" fullWidth>
                    ルーム参加
                  </Button>
                </CardBody>
              </Card>
              
              <Card variant="elevated">
                <CardHeader>
                  <h3>ルーム一覧</h3>
                </CardHeader>
                <CardBody>
                  <p className="mb-4">公開されているルームを探してゲームに参加しよう</p>
                  <Button variant="outline" fullWidth>
                    ルーム一覧
                  </Button>
                </CardBody>
              </Card>
            </div>
            
            <div className="text-center">
              <h2 className="h2 mb-4">デザインシステム デモ</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <Button variant="primary" size="sm">Primary</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="success" size="sm">Success</Button>
                <Button variant="warning" size="sm">Warning</Button>
                <Button variant="error" size="sm">Error</Button>
                <Button variant="outline" size="sm">Outline</Button>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button variant="primary" loading>Loading...</Button>
                <Button variant="secondary" disabled>Disabled</Button>
                <Button variant="outline" size="lg">Large Button</Button>
              </div>
            </div>
          </main>
          
          <Footer />
        </Container>
    </div>
  );
};

export default HomePage;