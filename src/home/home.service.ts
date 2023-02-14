import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomeResponseDto } from './dto/home.dto';
import { PropertyType } from '@prisma/client';

interface GetHomesParam {
  city?: string;
  price?: {
    gte?: number;
    lte?: number;
  };
  propertyType?: PropertyType;
}

interface CreateHomeParams {
  address: string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  city: string;
  price: number;
  landSize: number;
  propertyType: PropertyType;
  images: { url: string }[];
}

interface UpdateHomeParams {
  address?: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  city?: string;
  price?: number;
  landSize?: number;
  propertyType?: PropertyType;
}

const homeSelect = {
  id: true,
  address: true,
  city: true,
  price: true,
  propertyType: true,
  number_of_bathrooms: true,
  number_of_beadrooms: true,
};

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}
  async getHomes(filter: GetHomesParam): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
      select: {
        ...homeSelect,
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
      where: filter,
    });
    if (!homes.length) throw new NotFoundException();

    return homes.map(
      (home) => new HomeResponseDto({ ...home, image: home.images[0].url }),
    );
  }

  async getHomeById(id: number) {
    const home = await this.prismaService.home.findUnique({
      where: { id },
      select: {
        ...homeSelect,
        images: {
          select: {
            url: true,
          },
        },
        realtor: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
    if (!home) throw new NotFoundException();

    return new HomeResponseDto(home);
  }

  async createHome({
    address,
    numberOfBedrooms,
    numberOfBathrooms,
    city,
    landSize,
    price,
    propertyType,
    images,
  }: CreateHomeParams) {
    const home = await this.prismaService.home.create({
      data: {
        address,
        number_of_beadrooms: numberOfBedrooms,
        number_of_bathrooms: numberOfBathrooms,
        city,
        land_size: landSize,
        price,
        propertyType,
        realtor_id: 4,
      },
    });

    const homeImages = images.map((image) => {
      return { ...image, home_id: home.id };
    });

    await this.prismaService.image.createMany({ data: homeImages });
    return new HomeResponseDto(home);
  }

  async updateHome(data: UpdateHomeParams, id: number) {
    const home = this.prismaService.home.findUnique({ where: { id } });
    if (!home) throw new NotFoundException();

    const updatedHome = await this.prismaService.home.update({
      where: { id },
      data: data,
    });

    return new HomeResponseDto(updatedHome);
  }

  async deleteHome(id: number) {
    await this.prismaService.image.deleteMany({
      where: { home_id: id },
    });
    return this.prismaService.home.delete({ where: { id } });
  }
}
