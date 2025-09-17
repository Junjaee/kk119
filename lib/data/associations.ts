export interface Association {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

// 협회 목록 - 필요시 여기에 추가
export const associations: Association[] = [
  {
    id: 'gyeonggi-elementary',
    name: '경기초등교사협회',
    description: '경기도 소재 초등학교 교사들의 협회',
    isActive: true
  },
  // 여기에 새로운 협회들을 추가할 수 있습니다
];

// 협회 관련 유틸리티 함수들
export const associationUtils = {
  // 활성화된 협회만 가져오기
  getActiveAssociations: (): Association[] => {
    return associations.filter(association => association.isActive);
  },

  // ID로 협회 찾기
  getAssociationById: (id: string): Association | undefined => {
    return associations.find(association => association.id === id);
  },

  // 협회 이름으로 찾기
  getAssociationByName: (name: string): Association | undefined => {
    return associations.find(association => association.name === name);
  },

  // 새 협회 추가 (관리자용)
  addAssociation: (association: Omit<Association, 'id'>): Association => {
    const newAssociation: Association = {
      ...association,
      id: `association-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    associations.push(newAssociation);
    return newAssociation;
  }
};