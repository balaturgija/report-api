import { Test, TestingModule } from '@nestjs/testing';
import { HomeService, homeSelect } from './home.service';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockgetHomes = [
  {
    id: 1,
    address: 'Bračka ul. 10',
    city: 'Osijek',
    price: 120000,
    propertyType: PropertyType.RESIDENTAL,
    image: 'img1',
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    images: [
      {
        uerl: 'src1',
      },
    ],
  },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockgetHomes),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHomes', () => {
    const filters = {
      city: 'Osijek',
      price: {
        gte: 100000,
        lte: 150000,
      },
      propertyType: PropertyType.RESIDENTAL,
    };
    it('should call prisma home.findMany with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockgetHomes);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHomes(filters);
      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          ...homeSelect,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: {
          city: 'Osijek',
          price: {
            gte: 100000,
            lte: 150000,
          },
          propertyType: PropertyType.RESIDENTAL,
        },
      });
    });

    it('should throw not found exception if no homes are found', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await expect(service.getHomes(filters)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });
});
